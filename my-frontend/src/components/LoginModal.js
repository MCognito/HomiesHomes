// src/components/LoginModal.js
import React, { useState } from "react";

/**
 * Displays a form for either login or registration
 * Switches between modes and handles validation
 */
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
  // Track form validation errors for each field
  const [validationErrors, setValidationErrors] = useState({});

  // Process form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check for input errors before submitting
    const errors = {};

    if (isRegistering) {
      // Make sure registration fields look good

      // Username checks
      if (!registerData.username || registerData.username.trim() === "") {
        errors.username = "Username is required";
      } else if (!/^[a-zA-Z0-9_-]+$/.test(registerData.username)) {
        errors.username =
          "Username can only contain letters, numbers, underscores, and hyphens";
      }

      // Password strength and security
      if (!registerData.password || registerData.password.trim() === "") {
        errors.password = "Password is required";
      } else if (registerData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerData.password)
      ) {
        errors.password =
          "Password must include uppercase, lowercase, and a number";
      }

      // Email format validation
      if (!registerData.user_email || registerData.user_email.trim() === "") {
        errors.email = "Email is required";
      } else if (
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          registerData.user_email
        )
      ) {
        errors.email = "Please enter a valid email address";
      }

      // First name - letters, spaces and basic punctuation only
      if (
        registerData.user_firstName &&
        registerData.user_firstName.trim() !== ""
      ) {
        if (!/^[a-zA-Z\s'-]+$/.test(registerData.user_firstName)) {
          errors.firstName =
            "First name can only contain letters, spaces, apostrophes, and hyphens";
        }
      }

      // Last name - letters, spaces and basic punctuation only
      if (
        registerData.user_lastName &&
        registerData.user_lastName.trim() !== ""
      ) {
        if (!/^[a-zA-Z\s'-]+$/.test(registerData.user_lastName)) {
          errors.lastName =
            "Last name can only contain letters, spaces, apostrophes, and hyphens";
        }
      }

      // Phone number format check
      if (
        registerData.user_phone &&
        !/^\+?[0-9\s-]{8,15}$/.test(registerData.user_phone)
      ) {
        errors.phone = "Phone number format is invalid";
      }
    } else {
      // Just check for missing username/password when logging in
      if (!loginUsername || loginUsername.trim() === "") {
        errors.username = "Username is required";
      }

      if (!loginPassword || loginPassword.trim() === "") {
        errors.password = "Password is required";
      }
    }

    // Show errors if found, otherwise submit the form
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // clear errors and proceed
    setValidationErrors({});
    onSubmit(e);
  };

  // Clear field errors when user starts typing again
  const handleInputChange = (setter, field) => (e) => {
    // Remove error message once user starts fixing the field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    setter(e);
  };

  return (
    <div className="login-modal">
      <div className="login-box">
        <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
        <form onSubmit={handleSubmit}>
          {isRegistering ? (
            <>
              <div className="form-field">
                <input
                  type="text"
                  placeholder="Username"
                  value={registerData.username}
                  onChange={handleInputChange(
                    (e) =>
                      onRegisterChange({
                        target: {
                          name: "username",
                          value: e.target.value,
                        },
                      }),
                    "username"
                  )}
                  className={validationErrors.username ? "error-input" : ""}
                  required
                />
                {validationErrors.username && (
                  <span className="field-error">
                    {validationErrors.username}
                  </span>
                )}
              </div>

              <div className="form-field">
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email || registerData.user_email}
                  onChange={handleInputChange(
                    (e) =>
                      onRegisterChange({
                        target: {
                          name: "user_email",
                          value: e.target.value,
                        },
                      }),
                    "email"
                  )}
                  className={validationErrors.email ? "error-input" : ""}
                  required
                />
                {validationErrors.email && (
                  <span className="field-error">{validationErrors.email}</span>
                )}
              </div>

              <div className="form-field">
                <input
                  type="text"
                  placeholder="First Name"
                  value={registerData.user_firstName || ""}
                  onChange={handleInputChange(
                    (e) =>
                      onRegisterChange({
                        target: {
                          name: "user_firstName",
                          value: e.target.value,
                        },
                      }),
                    "firstName"
                  )}
                  className={validationErrors.firstName ? "error-input" : ""}
                  required
                />
                {validationErrors.firstName && (
                  <span className="field-error">
                    {validationErrors.firstName}
                  </span>
                )}
              </div>

              <div className="form-field">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={registerData.user_lastName || ""}
                  onChange={handleInputChange(
                    (e) =>
                      onRegisterChange({
                        target: {
                          name: "user_lastName",
                          value: e.target.value,
                        },
                      }),
                    "lastName"
                  )}
                  className={validationErrors.lastName ? "error-input" : ""}
                  required
                />
                {validationErrors.lastName && (
                  <span className="field-error">
                    {validationErrors.lastName}
                  </span>
                )}
              </div>

              <div className="form-field">
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={registerData.user_phone || ""}
                  onChange={handleInputChange(
                    (e) =>
                      onRegisterChange({
                        target: {
                          name: "user_phone",
                          value: e.target.value,
                        },
                      }),
                    "phone"
                  )}
                  className={validationErrors.phone ? "error-input" : ""}
                />
                {validationErrors.phone && (
                  <span className="field-error">{validationErrors.phone}</span>
                )}
              </div>

              <div className="form-field">
                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={handleInputChange(
                    (e) =>
                      onRegisterChange({
                        target: {
                          name: "password",
                          value: e.target.value,
                        },
                      }),
                    "password"
                  )}
                  className={validationErrors.password ? "error-input" : ""}
                  required
                />
                {validationErrors.password && (
                  <span className="field-error">
                    {validationErrors.password}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <input
                  type="text"
                  placeholder="Username"
                  value={loginUsername}
                  onChange={handleInputChange(
                    onLoginUsernameChange,
                    "username"
                  )}
                  className={validationErrors.username ? "error-input" : ""}
                  required
                />
                {validationErrors.username && (
                  <span className="field-error">
                    {validationErrors.username}
                  </span>
                )}
              </div>

              <div className="form-field">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={handleInputChange(
                    onLoginPasswordChange,
                    "password"
                  )}
                  className={validationErrors.password ? "error-input" : ""}
                  required
                />
                {validationErrors.password && (
                  <span className="field-error">
                    {validationErrors.password}
                  </span>
                )}
              </div>
            </>
          )}
          <button type="submit">{isRegistering ? "Sign Up" : "Login"}</button>
        </form>

        {loginError && <div className="error">{loginError}</div>}

        <div className="toggle-auth">
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <span className="auth-link" onClick={onToggleMode}>
                Login
              </span>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <span className="auth-link" onClick={onToggleMode}>
                Sign Up
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
