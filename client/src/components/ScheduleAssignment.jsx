import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ScheduleAssignment = () => {
  const [personnel, setPersonnel] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ status: '', location: '', time: '' });
  const [syncMessage, setSyncMessage] = useState('');

  // Base URL for your backend
  const BASE_URL = 'http://192.168.177.28:3001';

  // Function to get image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return null; // Return null instead of placeholder
    return `${BASE_URL}/uploads/${imageName}`;
  };

  // Component for avatar display
  const Avatar = ({ imageName, userName, size = 'h-8 w-8' }) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = getImageUrl(imageName);
    
    if (!imageUrl || imageError) {
      return (
        <div className={`${size} rounded-full bg-gray-200 flex items-center justify-center text-gray-500`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
      );
    }
    
    return (
      <img 
        className={`${size} rounded-full object-cover border border-gray-200`}
        src={imageUrl}
        alt={userName || 'Tanod'}
        onError={() => setImageError(true)}
      />
    );
  };

  // Function to insert log entry
  const insertLogEntry = async (user, time, location, action = 'Status Updated', details = '') => {
    try {
      const response = await axios.post(`${BASE_URL}/api/logs`, {
        user,
        time,
        location,
        action,
        details
      });
      
      if (response.data.success) {
        console.log('Log entry created successfully:', response.data);
        return response.data;
      } else {
        console.error('Failed to create log entry:', response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      console.error('Error creating log entry:', err);
      return { success: false, message: err.message };
    }
  };

  // Function to load schedules from the database
  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      // Fetch schedule data
      const scheduleResponse = await axios.get(`${BASE_URL}/api/schedules`);
      
      if (scheduleResponse.data && Array.isArray(scheduleResponse.data)) {
        console.log("Loaded schedules:", scheduleResponse.data);
        setPersonnel(scheduleResponse.data);
      } else {
        console.log("No schedules found or invalid data format");
        setPersonnel([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading tanod schedules:', err);
      setError('Failed to load tanod schedules. Please try again later.');
      setIsLoading(false);
    }
  };

  // Function to sync tanods from users table
  const syncTanodsFromUsers = async () => {
    try {
      setIsLoading(true);
      setSyncMessage('Syncing tanods...');
      
      const response = await axios.post(`${BASE_URL}/api/sync-tanods`);
      
      if (response.data.success) {
        setSyncMessage(`Success! ${response.data.message}`);
        
        // Log the sync action
        await insertLogEntry(
          'Admin', 
          new Date().toISOString(), 
          'System', 
          'Tanod Sync', 
          `Synced ${response.data.count} tanods from users table`
        );
        
        // After successful sync, reload the schedules
        await loadSchedules();
      } else {
        setSyncMessage('Sync failed. Please try again.');
        setError('Failed to sync tanods from users table.');
      }
      
      // Clear sync message after 5 seconds
      setTimeout(() => {
        setSyncMessage('');
      }, 5000);
      
      return response.data;
    } catch (err) {
      console.error('Error syncing tanods:', err);
      setError('Failed to sync tanods from users table.');
      setIsLoading(false);
      setSyncMessage('');
      return { success: false, message: err.message };
    }
  };

  useEffect(() => {
    // Initial load of schedules
    loadSchedules();
  }, []);

  const handleClick = (person) => {
    setSelectedPerson(person);
    setFormData({
      status: person.STATUS || '',
      location: person.LOCATION || '',
      time: person.TIME || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPerson(null);
    setShowModal(false);
  };

  // Updated handleSave function with improved logging
  const handleSave = async () => {
    try {
      // Update the schedule first
      const response = await axios.put(`${BASE_URL}/api/schedules/${selectedPerson.ID}`, {
        status: formData.status,
        location: formData.location,
        time: formData.time
      });
      
      if (response.data.success) {
        // Update the personnel state with the updated data
        setPersonnel(prev =>
          prev.map(p =>
            p.ID === selectedPerson.ID ? { ...p, STATUS: formData.status, LOCATION: formData.location, TIME: formData.time } : p
          )
        );
        
        // Create log entry with USER, LOCATION, and TIME
        const logTime = formData.time || new Date().toISOString();
        const logLocation = formData.location || 'Not specified';
        const logAction = ` ${formData.status || 'Status Updated'}`;
        const logDetails = `Status: ${formData.status || 'Not specified'}, Location: ${logLocation}, Time: ${new Date(logTime).toLocaleString()}`;
        
        const logResult = await insertLogEntry(
          selectedPerson.USER,     // USER
          logTime,                 // TIME
          logLocation,             // LOCATION
          logAction,               // ACTION
          logDetails               // DETAILS
        );
        
        if (logResult.success) {
          console.log('Schedule updated and logged successfully');
        } else {
          console.warn('Schedule updated but logging failed:', logResult.message);
        }
        
        closeModal();
      } else {
        setError('Failed to update schedule. Please try again.');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('An error occurred while updating the schedule.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredPersonnel = personnel.filter(person =>
    person.USER?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    try {
      // Get the person details for logging before deletion
      const personToDelete = personnel.find(p => p.ID === id);
      
      const response = await axios.delete(`${BASE_URL}/api/schedules/${id}`);
      
      if (response.data.success) {
        // Log the deletion
        if (personToDelete) {
          await insertLogEntry(
            personToDelete.USER,
            new Date().toISOString(),
            personToDelete.LOCATION || 'Not specified',
            'Schedule Deleted',
            `Schedule entry removed for ${personToDelete.USER}`
          );
        }
        
        // Remove the deleted person from the state
        setPersonnel(prev => prev.filter(p => p.ID !== id));
      } else {
        setError('Failed to delete schedule entry.');
      }
    } catch (err) {
      console.error('Error deleting schedule entry:', err);
      setError('An error occurred while deleting the schedule entry.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm border-b border-red-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link to="/Dashboard" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Home
                </Link>
                <Link to="/incident-report" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Incident Report
                </Link>
                <Link to="/scheduling" className="border-indigo-500 text-indigo-600 hover:text-indigo-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Scheduling & Assessment
                </Link>
                <Link to="/gis-mapping" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                  GIS Mapping
                </Link>
                <Link to="/patrol-logs" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Patrol Logs
                </Link>
                <Link to="/accounts" className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Accounts
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8 rounded-full"
                  src="/api/placeholder/150/150"
                  alt="User avatar"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="mr-2">🗓️</span> Tanod Schedule & Assignment
          </h1>
          <p className="text-gray-600 mt-1">Manage tanod schedules, assign tanods, and track assignment status</p>
        </div>

        {/* Modal placement moved here */}
        {showModal && selectedPerson && (
          <div className="mb-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar 
                    imageName={selectedPerson.IMAGE} 
                    userName={selectedPerson.USER}
                    size="h-16 w-16"
                  />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Edit Schedule: {selectedPerson.USER || `Tanod #${selectedPerson.ID}`}
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Status:</label>
                    <select
                      name="status"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="">Select status</option>
                      <option value="Available">Available</option>
                      <option value="On its way to Incident">On way to incident</option>
                      <option value="On duty">On duty</option>
                      <option value="Off duty">Off duty</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Location:</label>
                    <input
                      type="text"
                      name="location"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Time:</label>
                    <input
                      type="datetime-local"
                      name="time"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.time}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-center space-x-3">
              <button 
                type="button" 
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
                onClick={handleSave}
              >
                Save
              </button>
              <button 
                type="button" 
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {syncMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{syncMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between">
            <div className="w-72">
              <input
                type="text"
                placeholder="Search tanods..."
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={syncTanodsFromUsers}
                disabled={isLoading}
              >
                {isLoading ? 'Syncing...' : 'Sync Tanods'}
              </button>
            </div>
          </div>
          
          {isLoading && !syncMessage ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-2 text-gray-500">Loading tanod schedules...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanod
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ASSIGNMENT Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPersonnel.length > 0 ? (
                    filteredPersonnel.map((person) => (
                      <tr key={person.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{person.ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="mr-3 flex-shrink-0">
                              <Avatar 
                                imageName={person.IMAGE} 
                                userName={person.USER}
                                size="h-8 w-8"
                              />
                            </div>
                            <div className="font-medium">
                              {person.USER}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${person.STATUS && person.STATUS.includes('Available') ? 'bg-green-100 text-green-800' : 
                              person.STATUS && person.STATUS.includes('way') ? 'bg-yellow-100 text-yellow-800' : 
                              person.STATUS && person.STATUS.includes('On duty') ? 'bg-blue-100 text-blue-800' : 
                              person.STATUS && person.STATUS.includes('Off duty') ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {person.STATUS || "Not set"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {person.LOCATION || "Not assigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {person.TIME ? new Date(person.TIME).toLocaleString() : "Not set"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleClick(person)} 
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(person.ID);
                            }} 
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No tanods found. Click "Sync Tanods" to fetch tanods from the users database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleAssignment;