import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar'; 

const PatrolLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activitiesSearchTerm, setActivitiesSearchTerm] = useState(''); // New search term for activities
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [patrolActivities, setPatrolActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state for both tables
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const itemsPerPage = 10;

  // Base URL for your backend
  const BASE_URL = 'http://192.168.209.28:3001';
  // 1. Add new state for patrol activities data
    const [patrolActivitiesData, setPatrolActivitiesData] = useState([]);
  // Function to truncate location text
  const truncateLocation = (text, maxLength = 18) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to load logs from the database
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${BASE_URL}/api/logs`);
      
      if (response.data && Array.isArray(response.data)) {
        // Transform the logs data for TANOD SCHEDULE table
        const transformedLogs = response.data.map((log, index) => ({
          id: log.ID || index + 1,
          tanod: log.USER || 'Unknown',
          timeIn: log.TIME_IN || 'Not specified', 
          timeOut: log.TIME_OUT || 'Not specified',
          location: log.LOCATION || 'Not specified',
          status: log.ACTION || 'No Action'
        }));
        
        // Filter activities that have been resolved/completed for PATROL ACTIVITIES table
        const activities = response.data
          .filter(log => log.ACTION === 'COMPLETED' || log.ACTION === 'RESOLVED INCIDENT' || log.TIME_OUT)
          .map((log, index) => ({
            id: log.ID || index + 1,
            tanod: log.USER || 'Unknown',
            timeResolved: log.TIME_OUT || log.TIME || 'Not specified',
            location: log.LOCATION || 'Not specified',
            status: log.ACTION || 'No Action'
          }));
        
        setPatrolLogs(transformedLogs);
        setPatrolActivities(activities);
      } else {
        console.log("No logs found or invalid data format");
        setPatrolLogs([]);
        setPatrolActivities([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading patrol logs:', err);
      setError('Failed to load patrol logs. Please try again later.');
      setIsLoading(false);
    }
  };

    useEffect(() => {
    loadLogs();
    loadPatrolActivities();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Filter logs based on search term for TANOD SCHEDULE
  const filteredLogs = patrolLogs.filter(log =>
    log.tanod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic for tanod schedule
  const totalSchedulePages = Math.ceil(filteredLogs.length / itemsPerPage);
  const scheduleStartIndex = (currentSchedulePage - 1) * itemsPerPage;
  const scheduleEndIndex = scheduleStartIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(scheduleStartIndex, scheduleEndIndex);

  // Filter activities based on search term for PATROL ACTIVITIES
  const filteredActivities = patrolActivitiesData.filter(activity =>
  activity.tanod.toLowerCase().includes(activitiesSearchTerm.toLowerCase()) ||
  activity.location.toLowerCase().includes(activitiesSearchTerm.toLowerCase()) ||
  activity.action.toLowerCase().includes(activitiesSearchTerm.toLowerCase())
  );

  // Pagination logic for patrol activities
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSchedulePageChange = (pageNumber) => {
    setCurrentSchedulePage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSchedulePrevPage = () => {
    if (currentSchedulePage > 1) {
      setCurrentSchedulePage(currentSchedulePage - 1);
    }
  };

  const handleScheduleNextPage = () => {
    if (currentSchedulePage < totalSchedulePages) {
      setCurrentSchedulePage(currentSchedulePage + 1);
    }
  };
  

    // 2. Create new function to load patrol activities from logs_patrol table
   const loadPatrolActivities = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/logs_patrol`);
          
          if (response.data && Array.isArray(response.data)) {
            const transformedActivities = response.data.map((activity, index) => ({
              id: activity.ID || index + 1,
              tanod: activity.USER || 'Unknown',
              time: activity.TIME || 'Not specified',
              location: activity.LOCATION || 'Not specified',
              action: activity.ACTION || 'No Action'
            }));
            
            setPatrolActivitiesData(transformedActivities);
          } else {
            setPatrolActivitiesData([]);
          }
        } catch (err) {
          console.error('Error loading patrol activities:', err);
          setPatrolActivitiesData([]);
        }
      };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Replace the hardcoded header with the Navbar component */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with better spacing */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="mr-3">🛡️</span> 
            <span>Patrol Logs</span>
          </h1>
          <p className="text-gray-600 mt-2">Track tanod schedules and patrol activities</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4">
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

        {/* TANOD SCHEDULE TABLE - Increased bottom margin */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-24">
          {/* Header with better padding and spacing */}
          <div className="px-6 py-8 border-b border-gray-200 sm:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h2 className="text-lg font-semibold text-gray-900">TANOD SCHEDULE</h2> &nbsp;&nbsp;&nbsp;&nbsp;
              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search Schedule"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-4 py-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Buttons with better spacing */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={loadLogs}
                className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                disabled={isLoading}
              >
                <span className="mr-2">🔄</span>
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button 
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <span className="mr-2">🖨️</span>
                Print Logs
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-4 text-gray-500">Loading patrol logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanod
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time In
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Out
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{log.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {log.tanod}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.timeIn !== 'Not specified' ? new Date(log.timeIn).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.timeOut !== 'Not specified' ? new Date(log.timeOut).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={log.location}>
                          {truncateLocation(log.location)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${log.status.includes('Available') ? 'bg-green-100 text-green-800' : 
                              log.status.includes('way') || log.status.includes('Progress') ? 'bg-yellow-100 text-yellow-800' : 
                              log.status.includes('duty') ? 'bg-blue-100 text-blue-800' : 
                              log.status.includes('Completed') || log.status.includes('Resolved') ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                        {isLoading ? "Loading..." : "No patrol logs found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination for Tanod Schedule */}
          {totalSchedulePages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={handleSchedulePrevPage}
                  disabled={currentSchedulePage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleScheduleNextPage}
                  disabled={currentSchedulePage === totalSchedulePages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{scheduleStartIndex + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">{Math.min(scheduleEndIndex, filteredLogs.length)}</span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredLogs.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={handleSchedulePrevPage}
                      disabled={currentSchedulePage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalSchedulePages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handleSchedulePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentSchedulePage === pageNumber
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    
                    <button
                      onClick={handleScheduleNextPage}
                      disabled={currentSchedulePage === totalSchedulePages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PATROL ACTIVITIES TABLE */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg" style={{marginTop: '30px',marginBottom: '20px'}}>
          <div className="px-6 py-8 border-b border-gray-200 sm:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h2 className="text-lg font-semibold text-gray-900">PATROL ACTIVITIES</h2> &nbsp;&nbsp;&nbsp;&nbsp;
              <div className="w-80">
                <input
                  type="text"
                  placeholder="Search Activities"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-4 py-2"
                  value={activitiesSearchTerm}
                  onChange={(e) => setActivitiesSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-4 text-gray-500">Loading patrol activities...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanod
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Resolved
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
{currentActivities.length > 0 ? (
  currentActivities.map((activity) => (
    <tr key={activity.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #{activity.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
          {activity.tanod}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {activity.time !== 'Not specified' ? new Date(activity.time).toLocaleString() : '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={activity.location}>
        {truncateLocation(activity.location)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${activity.action.includes('Available') ? 'bg-green-100 text-green-800' : 
            activity.action.includes('way') || activity.action.includes('Progress') ? 'bg-yellow-100 text-yellow-800' : 
            activity.action.includes('duty') ? 'bg-blue-100 text-blue-800' : 
            activity.action.includes('Completed') || activity.action.includes('Resolved') ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'}`}>
          {activity.action}
        </span>
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
      {isLoading ? "Loading..." : "No patrol activities found."}
    </td>
  </tr>
)}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Patrol Activities */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{startIndex + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredActivities.length)}</span>
                        {' '}of{' '}
                        <span className="font-medium">{filteredActivities.length}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}
                        
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatrolLogs;