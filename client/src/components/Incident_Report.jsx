import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import UserAvatarDropdown from './AvatarDropdown';
import './IncidentReport.css';

function IncidentReport() {
  const [incidents, setIncidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalType, setModalType] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableTanods, setAvailableTanods] = useState([]);
  const [selectedTanod, setSelectedTanod] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Under Review':
        return 'status-yellow';
      case 'In Progress':
        return 'status-blue';
      case 'Resolved':
        return 'status-green';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchData = () => {
      fetch("http://192.168.177.28:3001/api/incidents")
        .then(res => res.json())
        .then(data => setIncidents(data))
        .catch(err => {
          console.error("Failed to fetch incidents:", err);
          setIncidents([]);
        });
    };

    // Initial fetch
    fetchData();

    // Set interval for auto-refresh (e.g. every 30 seconds)
    const intervalId = setInterval(fetchData, 3000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Fetch current user info
  useEffect(() => {
    // Get username from localStorage or context
    const username = localStorage.getItem('username'); // Assuming you store username on login
    if (username) {
      fetch(`http://192.168.177.28:3001/api/user/${username}`)
        .then(res => res.json())
        .then(data => setCurrentUser(data))
        .catch(err => console.error("Failed to fetch user info:", err));
    }
  }, []);

  const fetchAvailableTanods = () => {
    // Get today's date
    const today = new Date().toISOString().slice(0, 10);
    
    fetch("http://192.168.177.28:3001/api/logs")
      .then(res => res.json())
      .then(data => {
        // Filter logs for today that have TIME_IN but no TIME_OUT
        const todayLogs = data.filter(log => {
          const logDate = log.TIME ? log.TIME.slice(0, 10) : null;
          return logDate === today && log.TIME_IN && !log.TIME_OUT;
        });
        
        // Get unique users who are currently on duty
        const availableUsers = todayLogs.reduce((acc, log) => {
          if (!acc.find(user => user.USER === log.USER)) {
            acc.push({
              USER: log.USER,
              TIME_IN: log.TIME_IN,
              ID: log.ID
            });
          }
          return acc;
        }, []);
        
        setAvailableTanods(availableUsers);
      })
      .catch(err => {
        console.error("Failed to fetch available tanods:", err);
        setAvailableTanods([]);
      });
  };

  const handleActionClick = (incident, type) => {
    setSelectedIncident(incident);
    setModalType(type);
    setShowModal(true);
  };

  const handleAssignTanodClick = (incident) => {
    setSelectedIncident(incident);
    fetchAvailableTanods();
    setShowAssignModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIncident(null);
    setModalType('');
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedIncident(null);
    setSelectedTanod('');
    setAvailableTanods([]);
  };
  
  const openConfirmationModal = () => {
    setShowConfirmation(true);
  };
  
  const closeConfirmationModal = () => {
    setShowConfirmation(false);
  };

  const handleAssignTanod = () => {
    if (!selectedTanod || !selectedIncident) {
      alert('Please select a tanod to assign');
      return;
    }

    setIsUpdating(true);
    
    // Update incident status to "In Progress" and assign tanod
    fetch(`http://192.168.177.28:3001/api/incidents/${selectedIncident.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: 'In Progress',
        assigned_tanod: selectedTanod 
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Update the incident in the local state
          setIncidents(prevIncidents => 
            prevIncidents.map(inc => 
              inc.id === selectedIncident.id 
                ? { ...inc, status: 'In Progress', assigned_tanod: selectedTanod } 
                : inc
            )
          );
          
          // Update the selected incident
          setSelectedIncident({
            ...selectedIncident, 
            status: 'In Progress', 
            assigned_tanod: selectedTanod
          });
          
          // Close assign modal
          closeAssignModal();
          alert(`Tanod ${selectedTanod} has been assigned to this incident`);
        } else {
          alert('Failed to assign tanod: ' + data.message);
        }
      })
      .catch(err => {
        console.error('Error assigning tanod:', err);
        alert('An error occurred while assigning the tanod');
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };
  
  const handleMarkAsResolved = () => {
    if (!selectedIncident) return;
    
    setIsUpdating(true);
    
    fetch(`http://192.168.177.28:3001/api/incidents/${selectedIncident.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'Resolved' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Update the incident in the local state
          setIncidents(prevIncidents => 
            prevIncidents.map(inc => 
              inc.id === selectedIncident.id ? { ...inc, status: 'Resolved' } : inc
            )
          );
          
          // Update the selected incident
          setSelectedIncident({...selectedIncident, status: 'Resolved'});
          
          // Close confirmation modal
          setShowConfirmation(false);
        } else {
          alert('Failed to update status: ' + data.message);
        }
      })
      .catch(err => {
        console.error('Error updating incident status:', err);
        alert('An error occurred while updating the status');
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token'); // if you have auth tokens
    localStorage.removeItem('userId'); // if you store user ID
    
    // Optional: Clear all localStorage
    localStorage.clear();
    
    // Redirect to login page
    window.location.href = '/login';
    // Or use React Router: navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link to="/Dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/incident-report" className="border-indigo-500 text-indigo-600 hover:text-indigo-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Incident Report
                </Link>
                <Link to="/scheduling" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Scheduling & Assessment
                </Link>
                <Link to="/gis-mapping" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  GIS Mapping
                </Link>
                <Link to="/patrol-logs" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Patrol Logs
                </Link>
                <Link to="/accounts" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Accounts
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <UserAvatarDropdown 
                currentUser={currentUser} 
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="account-management-container">
        <div className="account-header">
          <div className="account-title">
            <span className="account-icon">🚨</span>
            <h2>Incident Reports</h2>
          </div>
          <div className="account-description">
            Manage incident reports, assign tanods, and track resolution status
          </div>
        </div>

        <div className="account-controls">
          <div className="search-container">
            <input type="text" placeholder="Search incidents..." className="search-input" />
          </div>
        </div>

        <div className="table-container">
          <table className="accounts-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>ID</th>
                <th style={{width: '250px'}}>INCIDENT</th>
                <th style={{width: '100px'}}>TYPE</th>
                <th style={{width: '120px'}}>REPORTED BY</th>
                <th style={{width: '200px'}}>LOCATION</th>
                <th style={{width: '120px'}}>STATUS</th>
                <th style={{width: '140px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center'}}>No incidents found.</td>
                </tr>
              ) : (
                incidents.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td className="incident-cell">
                      <div className="incident-icon">
                        <img
                          src={`http://192.168.177.28:3001/uploads/${item.image}`}
                          alt="Incident"
                          className="small-avatar"
                        />
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{item.incident_type || "N/A"}</span>
                    </td>
                    <td>{item.reported_by || "Unknown"}</td>
                    <td>{item.location || "Not specified"}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(item.status)}`}>{item.status}</span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="edit-button"
                        onClick={() => handleActionClick(item, 'VIEW')}
                      >
                        View
                      </button>
                      <button className="delete-button">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedIncident && 
        createPortal(
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Incident Details</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <label>ID</label>
                  <div className="modal-value">#{selectedIncident.id}</div>
                </div>
                <div className="modal-field">
                  <label>Incident</label>
                  <div className="modal-value">{selectedIncident.incident_type}</div>
                </div>
                <div className="modal-field">
                  <label>Incident Photo</label>
                  <div className="modal-image-container">
                    <img 
                      src={`http://192.168.177.28:3001/uploads/${selectedIncident.image}`} 
                      alt="Incident" 
                      className="modal-image" 
                    />
                  </div>
                </div>
                <div className="modal-field">
                  <label>Status</label>
                  <div className="modal-value">{selectedIncident.status}</div>
                </div>
                <div className="modal-field">
                  <label>Location</label>
                  <div className="modal-value">{selectedIncident.location || "Not specified"}</div>
                </div>
                <div className="modal-field">
                  <label>Reported By</label>
                  <div className="modal-value">{selectedIncident.reported_by || "Unknown"}</div>
                </div>
                <div className="modal-field">
                  <label>Reported Time</label>
                  <div className="modal-value">{new Date(selectedIncident.datetime).toLocaleString()}</div>
                </div>
                {selectedIncident.assigned_tanod && (
                  <div className="modal-field">
                    <label>Assigned Tanod</label>
                    <div className="modal-value">{selectedIncident.assigned_tanod}</div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {modalType === 'VIEW' && (
                  <>
                    {selectedIncident.status !== 'Resolved' && (
                      <button className="btn resolve-btn" onClick={openConfirmationModal}>Mark as Resolved</button>
                    )}
                    {selectedIncident.status !== 'Resolved' && (
                      <button className="btn secondary" onClick={() => handleAssignTanodClick(selectedIncident)}>Assign Tanod</button>
                    )}
                  </>
                )}
                <button className="btn close" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {showAssignModal && selectedIncident && 
        createPortal(
          <div className="modal-overlay" onClick={closeAssignModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assign Tanod</h2>
                <button className="modal-close" onClick={closeAssignModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <label>Incident ID: #{selectedIncident.id}</label>
                  <div className="modal-value">{selectedIncident.incident_type}</div>
                </div>
                <div className="modal-field">
                  <label>Available Tanods (Currently On Duty)</label>
                  {availableTanods.length === 0 ? (
                    <div className="modal-value" style={{color: '#666', fontStyle: 'italic'}}>
                      No tanods are currently on duty
                    </div>
                  ) : (
                    <select 
                      className="tanod-select"
                      value={selectedTanod}
                      onChange={(e) => setSelectedTanod(e.target.value)}
                    >
                      <option value="">Select a tanod...</option>
                      {availableTanods.map((tanod) => (
                        <option key={tanod.ID} value={tanod.USER}>
                          {tanod.USER} (On duty since: {new Date(tanod.TIME_IN).toLocaleTimeString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn primary" 
                  onClick={handleAssignTanod}
                  disabled={isUpdating || !selectedTanod || availableTanods.length === 0}
                >
                  {isUpdating ? 'Assigning...' : 'Assign Tanod'}
                </button>
                <button className="btn close" onClick={closeAssignModal}>Cancel</button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
      
      {showConfirmation && selectedIncident && 
        createPortal(
          <div className="modal-overlay" onClick={closeConfirmationModal}>
            <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="confirmation-header">
                <h3>Confirm Action</h3>
                <button className="modal-close" onClick={closeConfirmationModal}>×</button>
              </div>
              <div className="confirmation-body">
                <p>Are you sure you want to mark this incident as resolved?</p>
                <p>Incident ID: #{selectedIncident.id}</p>
                <p>Type: {selectedIncident.incident_type}</p>
              </div>
              <div className="confirmation-footer">
                <button 
                  className="btn primary" 
                  onClick={handleMarkAsResolved}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Confirm'}
                </button>
                <button className="btn close" onClick={closeConfirmationModal}>Cancel</button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}

export default IncidentReport;