import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar'; // Import the Navbar component
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* Replace the hardcoded header with the Navbar component */}
      <Navbar />
      
      <div className="homepage-wrapper">
        <div className="homepage-welcome">
          <h1>Welcome to BarangayWatch Admin Panel 🧑‍💼</h1>
          <p className="homepage-tagline">Manage user roles, accounts, and barangay access</p>
        </div>

        <div className="homepage-grid">
          <Link to="/accounts/residents" className="homepage-card">
            <h3>🏠 Resident Accounts</h3>
            <p>View and manage registered residents</p>
          </Link>

          <Link to="/accounts/barangay-officers" className="homepage-card">
            <h3>🧑 Barangay Officers</h3>
            <p>Manage officer accounts and privileges</p>
          </Link>

          <Link to="/accounts/admins" className="homepage-card">
            <h3>👮 Admin Accounts</h3>
            <p>Control admin-level users and access</p>
          </Link>

          <Link to="/accounts/create" className="homepage-card">
            <h3>➕ Create Account</h3>
            <p>Add new residents or officers to the system</p>
          </Link>

          <Link to="/accounts/logs" className="homepage-card">
            <h3>📜 Account Logs</h3>
            <p>View account activity and login logs</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;