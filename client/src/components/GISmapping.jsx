import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './GISmapping.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different incident types
const createCustomIcon = (incidentType) => {
  const colors = {
    'Fire': '#ff4444',
    'Accident': '#ff8800',
    'Crime': '#8800ff',
    'Emergency': '#ff0088',
    'Other': '#0088ff'
  };
  
  const color = colors[incidentType] || colors['Other'];
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

function GISMapping() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.565307024431522, 121.61516580730677]); // Default to Manila coordinates

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.177.28:3001/api/incidents');
      
      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }
      
      const data = await response.json();
      
      // Filter out incidents without valid coordinates
      const validIncidents = data.filter(incident => 
        incident.latitude && 
        incident.longitude && 
        !isNaN(parseFloat(incident.latitude)) && 
        !isNaN(parseFloat(incident.longitude))
      );
      
      setIncidents(validIncidents);
      
      // Set map center to the first incident location if available
      if (validIncidents.length > 0) {
        setMapCenter([
          parseFloat(validIncidents[0].latitude),
          parseFloat(validIncidents[0].longitude)
        ]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Failed to load incident data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#28a745';
      case 'In Progress': return '#ffc107';
      case 'Under Review': return '#dc3545';
      default: return '#6c757d';
    }
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
                  Home
                </Link>
                <Link to="/incident-report" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Incident Report
                </Link>
                <Link to="/scheduling" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Scheduling & Assessment
                </Link>
                <Link to="/gis-mapping" className="border-indigo-500 text-indigo-600 hover:text-indigo-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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

      <div className="gis-mapping-wrapper">
        <div className="gis-header">
          <h2>📍 Incident Mapping System</h2>
          <p>Interactive map showing all reported incidents with their locations</p>
          <div className="map-stats">
            <span className="stat-item">
              Total Incidents: <strong>{incidents.length}</strong>
            </span>
            <button onClick={fetchIncidents} className="refresh-btn">
              🔄 Refresh Data
            </button>
          </div>
        </div>

        <div className="map-legend">
          <h4>Legend:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#ff4444'}}></div>
              <span>Fire</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#ff8800'}}></div>
              <span>Accident</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#8800ff'}}></div>
              <span>Crime</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#ff0088'}}></div>
              <span>Emergency</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#0088ff'}}></div>
              <span>Other</span>
            </div>
          </div>
        </div>

        <div className="map-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading incident data...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={fetchIncidents} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '600px', width: '100%' }}
              className="leaflet-map"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {incidents.map(incident => (
                <Marker
                  key={incident.id}
                  position={[parseFloat(incident.latitude), parseFloat(incident.longitude)]}
                  icon={createCustomIcon(incident.incident_type)}
                >
                  <Popup>
                    <div className="incident-popup">
                      <h4>{incident.incident_type}</h4>
                      <div className="popup-details">
                        <p><strong>Location:</strong> {incident.location}</p>
                        <p><strong>Date:</strong> {formatDateTime(incident.datetime)}</p>
                        <p><strong>Reported by:</strong> {incident.reported_by}</p>
                        <p>
                          <strong>Status:</strong> 
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: getStatusColor(incident.status),
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              marginLeft: '5px'
                            }}
                          >
                            {incident.status}
                          </span>
                        </p>
                        <p><strong>Coordinates:</strong> {incident.latitude}, {incident.longitude}</p>
                        {incident.image && (
                          <div className="popup-image">
                            <img 
                              src={`http://192.168.177.28:3001/uploads/${incident.image}`}
                              alt="Incident"
                              style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {!loading && !error && incidents.length === 0 && (
          <div className="no-data-state">
            <p>📍 No incident data available with valid coordinates</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GISMapping;