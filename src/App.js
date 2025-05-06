import React from "react";
import './App.css';
import About from './About';


function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="left">
          <img src="/images/logo.png" alt="Logo" className="logo" />
          <h1>PatrolTrack</h1>
        </div>
        <div className="right">
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
          <button className="login-btn1">Log in</button>
        </div>
      </header>

      <main className="hero">
        <div className="overlay">
          <h2>Welcome to Barangay Tanod Patrol Optimization System</h2>
          <p>Optimizing Safety & Community Engagement</p>
          <button className="login-btn1">Get Started</button>
        </div>
      </main>

      <About />
    </div>
  );
}

export default App;
