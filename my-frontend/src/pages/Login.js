import React from "react";
import { Link } from "react-router-dom";
import "../App.css";
import logo from "../images/logobg.png"; // Correctly Import Logo

const Login = () => {
  return (
    <div className="auth-container">
      {/* Left Side - Logo Section */}
      <div className="auth-left">
        <img src={logo} alt="Homies Homes Logo" className="auth-logo" />
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-right">
        <h2 className="auth-title">Sign In</h2>
        <form className="auth-form">
          <label>Username</label>
          <input type="text" placeholder="Enter your username" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

          <button type="submit" className="auth-button">Login</button>
          <p>
            Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
