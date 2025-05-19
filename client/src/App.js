import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './components/Login';
import About from "./components/About";
import Home from "./components/Dashboard";
import IncidentReport from "./components/Incident_Report";
import ScheduleAssignment from './components/ScheduleAssignment'; // Import your new component
import "./App.css";
import PatrolLogs from "./components/Patrollogs";
import Accounts from "./components/Accounts";
import GISMapping from "./components/GISmapping";


function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    localStorage.setItem("isLoggedIn", true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
  };

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="left">
            <img src="logo.png" alt="Logo" className="logo" />
            <h1>PatrolTrack</h1>
          </div>
          <div className="right">
            {!isLoggedIn && (
              <>
                <a href="#about">About Us</a>
                <a href="#contact">Contact</a>
                <button className="login-btn1" onClick={() => setShowLogin(true)}>
                  Log in
                </button>
              </>
            )}
  
        </div>
        </header>

        {/* Show content if not logged in */}
        {!isLoggedIn && !showLogin && (
          <>
            <main className="hero">
              <div className="overlay">
                <h2>Welcome to Barangay Tanod Patrol Optimization System</h2>
                <p>Optimizing Safety & Community Engagement</p>
                <button className="login-btn1" onClick={() => setShowLogin(true)}>
                  Get Started
                </button>
              </div>
            </main>
            <About />
          </>
        )}

        {/* Show Login form */}
        {showLogin && <Login setShowLogin={setShowLogin} onLoginSuccess={handleLoginSuccess} />}

        {/* If logged in, render routes */}
        {isLoggedIn && (
          <Routes>
            <Route path="/Dashboard" element={<Home />} />
            <Route path="/incident-report" element={<IncidentReport />} />
            <Route path="/scheduling" element={<ScheduleAssignment />} />
            <Route path="/patrol-logs" element={<PatrolLogs />} />
            <Route path="/Accounts" element={<Accounts />} />
            <Route path="/gis-mapping" element={<GISMapping />} />
            <Route path="*" element={<Navigate to="/Dashboard" />} />

          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
