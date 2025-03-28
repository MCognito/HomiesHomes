// src/components/LoginModal.js
import React from "react";

const LoginModal = ({
  isRegistering,
  loginUsername,
  loginPassword,
  registerData,
  loginError,
  onLoginUsernameChange,
  onLoginPasswordChange,
  onRegisterChange,
  onSubmit,
  onToggleMode,
}) => {
  return (
    <div className="login-modal">
      <div className="login-box">
        <h2>{isRegistering ? "Register" : "Login"}</h2>
        <form onSubmit={onSubmit}>
          {isRegistering ? (
            <>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={registerData.username}
                onChange={onRegisterChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={onRegisterChange}
                required
              />
              <input
                type="email"
                name="user_email"
                placeholder="Email"
                value={registerData.user_email}
                onChange={onRegisterChange}
                required
              />
              <input
                type="text"
                name="user_phone"
                placeholder="Phone Number"
                value={registerData.user_phone}
                onChange={onRegisterChange}
              />
              <input
                type="text"
                name="user_firstName"
                placeholder="First Name"
                value={registerData.user_firstName}
                onChange={onRegisterChange}
                required
              />
              <input
                type="text"
                name="user_lastName"
                placeholder="Last Name"
                value={registerData.user_lastName}
                onChange={onRegisterChange}
                required
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Username"
                value={loginUsername}
                onChange={onLoginUsernameChange}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={onLoginPasswordChange}
                required
              />
            </>
          )}
          <button type="submit">{isRegistering ? "Register" : "Login"}</button>
        </form>

        {loginError && <p className="error">{loginError}</p>}

        <div className="toggle-auth">
          {isRegistering ? (
            <p>
              Already have an account?{" "}
              <span onClick={onToggleMode} className="auth-link">
                Login here
              </span>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <span onClick={onToggleMode} className="auth-link">
                Register here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
