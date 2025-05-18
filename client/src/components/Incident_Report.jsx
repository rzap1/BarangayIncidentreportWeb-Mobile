import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import './IncidentReport.css';

const incidents = [
  { id: 1, incident: 'Reported Sunog', username: 'maria123', email: 'maria@example.com', status: 'Under Review', action: 'VIEW' },
  { id: 2, incident: 'Reported Suntukan sa highway', username: 'juandelacruz', email: 'juan@example.com', status: 'Resolved', action: 'RESOLVED' },
  { id: 3, incident: 'Reported Banggaan ng Sasakyan', username: 'anareyes', email: 'ana@example.com', status: 'In Progress', action: 'Tanod is On the way!' },
];

function IncidentReport() {
  const [showModal, setShowModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalType, setModalType] = useState('');

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

      {/* Main Content */}
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
              {incidents.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td className="incident-cell">
                    <div className="incident-icon">
                      <img src="/user-icon.png" alt="Profile" className="small-avatar" />
                    </div>
                    <div className="incident-text" title={item.incident}>{item.incident}</div>
                  </td>
                  <td>
                    <span className={`type-badge ${getIncidentType(item.incident)}`}>
                      {getIncidentType(item.incident)}
                    </span>
                  </td>
                  <td>{item.username}</td>
                  <td>{getIncidentLocation(item.action)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-button"
                      onClick={() => handleActionClick(item, item.action)}
                    >
                      Edit
                    </button>
                    <button className="delete-button">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Portal */}
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
                  <div className="modal-value">{selectedIncident.id}</div>
                </div>
                <div className="modal-field">
                  <label>Incident</label>
                  <div className="modal-value">{selectedIncident.incident}</div>
                </div>
                <div className="modal-field">
                  <label>Incident Photo</label>
                  <div className="modal-image-container">
                    <img src="/user-icon.png" alt="Incident" className="modal-image" />
                  </div>
                </div>
                <div className="modal-field">
                  <label>Status</label>
                  <div className="modal-value">
                    {selectedIncident.status}
                  </div>
                </div>
                <div className="modal-field">
                  <label>Location</label>
                  <div className="modal-value">
                    {getIncidentLocation(selectedIncident.action)}
                  </div>
                </div>
                <div className="modal-field">
                  <label>Reported By</label>
                  <div className="modal-value">{selectedIncident.username}</div>
                </div>
                <div className="modal-field">
                  <label>Reported Time</label>
                  <div className="modal-value">{new Date().toLocaleString()}</div>
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

function getIncidentType(incident) {
  if (incident.toLowerCase().includes('sunog')) return 'Fire';
  if (incident.toLowerCase().includes('suntukan')) return 'Violence';
  if (incident.toLowerCase().includes('banggaan')) return 'Accident';
  return 'Other';
}

function getIncidentLocation(action) {
  switch(action) {
    case 'RESOLVED': return 'Highway Km 18';
    case 'Tanod is On the way!': return 'Corner Rizal and Bonifacio St.';
    case 'VIEW': return 'Not specified';
    default: return 'Unknown';
  }
}

function getStatusClass(status) {
  switch(status) {
    case 'Resolved': return 'resolved';
    case 'In Progress': return 'in-progress';
    case 'Under Review': return 'under-review';
    default: return '';
  }
}

export default IncidentReport;