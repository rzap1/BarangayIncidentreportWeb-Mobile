import React, { useState } from "react";
import "./Login.css";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

const Login = ({ setShowLogin, onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    // Simple validation
    if (!username || !password) {
      setMessage("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://192.168.125.28:3001/login", {
        username,
        password,
      });

      setMessage(res.data.message);

      if (res.data.success) {
        // Store user data in localStorage
        localStorage.setItem('username', username);
        
        // If your backend returns additional user data, store it
        if (res.data.user) {
          localStorage.setItem('userRole', res.data.user.role || res.data.user.ROLE);
          localStorage.setItem('userId', res.data.user.id || res.data.user.ID);
          // Store the IMAGE if it's returned in login response
          if (res.data.user.image || res.data.user.IMAGE) {
            localStorage.setItem('userImage', res.data.user.image || res.data.user.IMAGE);
          }
        }
        
        // Store token if returned
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }

        console.log('Login successful, stored data:', {
          username: localStorage.getItem('username'),
          userRole: localStorage.getItem('userRole'),
          userId: localStorage.getItem('userId'),
          userImage: localStorage.getItem('userImage')
        });

        // Trigger login success in App.js
        onLoginSuccess();
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="back-arrow" onClick={() => setShowLogin(false)}>
        <FaArrowLeft />
      </div>
      <div className="login-box">
        <div className="avatar">ADMIN</div>

        <input
          type="text"
          placeholder="Username"
          className="input-box"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setMessage("");
          }}
        />

        <input
          type="password"
          placeholder="Password"
          className="input-box"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setMessage("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "LOG IN"}
        </button>

        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
};

export default Login;