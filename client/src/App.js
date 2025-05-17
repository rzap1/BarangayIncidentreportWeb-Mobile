import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './components/Login';
import About from "./components/About";
import Home from "./components/Dashboard";
import IncidentReport from "./components/Incident_Report"; // Add this component
import "./App.css";

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
            {isLoggedIn && (
              <button className="login-btn1" onClick={handleLogout}>
                Log out
              </button>
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
            <Route path="/" element={<Home />} />
            <Route path="/incident-report" element={<IncidentReport />} />
            {/* You can add more routes here */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
