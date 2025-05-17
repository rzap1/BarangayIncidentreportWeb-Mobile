import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const Home = () => {
  return (
    <div className="home">
      <nav className="navbar">
        <ul>
          <li><Link to="/incident-report">Incident Report</Link></li>
          <li>Scheduling & Assignment</li>
          <li>GIS Mapping</li>
          <li>Patrol Logs</li>
          <li>Data</li>
          <li className="logout">Log out</li>
        </ul>
      </nav>
      <div className="content">
        <h1>Welcome to Barangay Tanod Patrol Optimization System</h1>
        <p>Optimizing Safety & Community Engagement </p>
      </div>
    </div>
  );
};

export default Home;
