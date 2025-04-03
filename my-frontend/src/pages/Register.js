import React from "react";
import { Link } from "react-router-dom";
import "../App.css";
import logo from "../assets/logobg.png"; 

const Register = () => {
  return (
    <div className="auth-container">
      {/* Left Side - Logo Section */}
      <div className="auth-left">
        <img src={logo} alt="Homies Homes Logo" className="auth-logo" />
      </div>

      {/* Right Side - Register Form */}
      <div className="auth-right">
        <h2 className="auth-title">Sign Up</h2>
        <form className="auth-form">
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name" />

          <label>Email</label>
          <input type="email" placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" placeholder="Enter your password" />

          <button type="submit" className="auth-button">Register</button>
          <p>
            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
