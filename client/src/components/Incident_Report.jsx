import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import './IncidentReport.css';

function IncidentReport() {
  const [incidents, setIncidents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalType, setModalType] = useState('');
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
      fetch("http://192.168.180.28:3001/api/incidents")
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

  const handleActionClick = (incident, type) => {
    setSelectedIncident(incident);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIncident(null);
    setModalType('');
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
              <div className="flex-shrink-0">
                <span className="relative inline-block">
                  <img
                    className="h-8 w-8 rounded-full"
                    src="/api/placeholder/150/150"
                    alt="User avatar"
                  />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white"></span>
                </span>
              </div>
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
          <button className="add-button">
            <span className="add-icon">+</span> Add Incident
          </button>
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
              src={`http://192.168.180.28:3001/uploads/${item.image}`}
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
                      src={`http://192.168.180.28:3001/uploads/${selectedIncident.image}`} 
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
              </div>

              <div className="modal-footer">
                {modalType === 'VIEW' && (
                  <>
                    <button className="btn primary">Mark as Resolved</button>
                    <button className="btn secondary">Assign Tanod</button>
                  </>
                )}
                <button className="btn close" onClick={closeModal}>Close</button>
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
