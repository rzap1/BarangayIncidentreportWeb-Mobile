import React from "react";
import "./Login.css";
import { FaArrowLeft } from "react-icons/fa";

const Login = ({ setShowLogin }) => {
  return (
    <div className="login-container">
      <div className="back-arrow" onClick={() => setShowLogin(false)}>
        <FaArrowLeft />
      </div>
      <div className="login-box">
        <div className="avatar">ADMIN</div>
        <input type="text" placeholder="Username" className="input-box" />
        <input type="password" placeholder="Password" className="input-box" />
        <button className="login-button">LOG IN</button>
      </div>
    </div>
  );
};

export default Login;
