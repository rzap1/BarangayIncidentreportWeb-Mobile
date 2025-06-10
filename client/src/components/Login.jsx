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
      const res = await axios.post("http://192.168.209.28:3001/login", {
        username,
        password,
        clientType: 'web' // Specify this is a web client request
      });

      setMessage(res.data.message);

      if (res.data.success) {
        // The backend already checks for Admin role for web clients
        const userRole = res.data.user?.role || res.data.user?.ROLE;
        
        // Double-check for security (though backend already validates this)
        if (userRole !== 'Admin') {
          setMessage("Access denied. Only Admin users are allowed to login.");
          setLoading(false);
          return;
        }

        // Store user data in memory variables instead of localStorage
        // Note: Using localStorage is not recommended in Claude.ai artifacts
        const userData = {
          username: username,
          userRole: userRole,
          userId: res.data.user.id,
          userName: res.data.user.name,
          userEmail: res.data.user.email,
          userAddress: res.data.user.address,
          userStatus: res.data.user.status,
          userImage: res.data.user.image
        };

        console.log('Login successful, user data:', userData);

        // Pass user data to parent component
        onLoginSuccess(userData);
      }
    } catch (err) {
      // Handle different error scenarios
      if (err.response?.status === 403) {
        setMessage(err.response.data.error || "Access denied");
      } else if (err.response?.status === 401) {
        setMessage("Invalid username or password");
      } else if (err.response?.status === 400) {
        setMessage(err.response.data.error || "Please check your input");
      } else {
        setMessage(err.response?.data?.error || "Login failed. Please try again.");
      }
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