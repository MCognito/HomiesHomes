import React, { useState } from "react";
import "../App.css";
import "../styles/Auth.css";
import logo from "../assets/logobg.png"; // Import logo from assets folder

const Login = ({
  onLogin,
  loginUsername,
  loginPassword,
  loginError,
  onLoginUsernameChange,
  onLoginPasswordChange,
  onLoginSubmit,
  isRegistering,
  setIsRegistering,
  registerData,
  onRegisterChange,
  onRegister,
}) => {
  // Determine which form to show
  return isRegistering ? (
    <RegisterForm
      registerData={registerData}
      onRegisterChange={onRegisterChange}
      onRegister={onRegister}
      setIsRegistering={setIsRegistering}
      loginError={loginError}
    />
  ) : (
    <LoginForm
      loginUsername={loginUsername}
      loginPassword={loginPassword}
      loginError={loginError}
      onLoginUsernameChange={onLoginUsernameChange}
      onLoginPasswordChange={onLoginPasswordChange}
      onLoginSubmit={onLoginSubmit}
      setIsRegistering={setIsRegistering}
    />
  );
};

// Login Form Component
const LoginForm = ({
  loginUsername,
  loginPassword,
  loginError,
  onLoginUsernameChange,
  onLoginPasswordChange,
  onLoginSubmit,
  setIsRegistering,
}) => {
  return (
    <div className="auth-container">
      {/* Left Side - Logo Section */}
      <div className="auth-left">
        <img src={logo} alt="Homies Homes Logo" className="auth-logo" />
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-right">
        <h2 className="auth-title">Sign In</h2>

        {loginError && <p className="auth-error">{loginError}</p>}

        <form className="auth-form" onSubmit={onLoginSubmit}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={loginUsername}
            onChange={onLoginUsernameChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={loginPassword}
            onChange={onLoginPasswordChange}
            required
          />

          <button type="submit" className="auth-button">
            Login
          </button>
          <p>
            Don't have an account?
            <a
              href="#"
              onClick={() => setIsRegistering(true)}
              className="auth-link"
            >
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

// Register Form Component
const RegisterForm = ({
  registerData,
  onRegisterChange,
  onRegister,
  setIsRegistering,
  loginError,
}) => {
  return (
    <div className="auth-container">
      {/* Left Side - Logo Section */}
      <div className="auth-left">
        <img src={logo} alt="Homies Homes Logo" className="auth-logo" />
      </div>

      {/* Right Side - Register Form */}
      <div className="auth-right">
        <h2 className="auth-title">Create Account</h2>

        {loginError && <p className="auth-error">{loginError}</p>}

        <form className="auth-form" onSubmit={onRegister}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={registerData.username}
            onChange={onRegisterChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={registerData.password}
            onChange={onRegisterChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="user_email"
            placeholder="Enter email"
            value={registerData.user_email}
            onChange={onRegisterChange}
            required
          />

          <label>Phone</label>
          <input
            type="text"
            name="user_phone"
            placeholder="Enter phone number"
            value={registerData.user_phone}
            onChange={onRegisterChange}
          />

          <label>First Name</label>
          <input
            type="text"
            name="user_firstName"
            placeholder="Enter first name"
            value={registerData.user_firstName}
            onChange={onRegisterChange}
          />

          <label>Last Name</label>
          <input
            type="text"
            name="user_lastName"
            placeholder="Enter last name"
            value={registerData.user_lastName}
            onChange={onRegisterChange}
          />

          <button type="submit" className="auth-button">
            Register
          </button>
          <p>
            Already have an account?
            <a
              href="#"
              onClick={() => setIsRegistering(false)}
              className="auth-link"
            >
              Sign In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
