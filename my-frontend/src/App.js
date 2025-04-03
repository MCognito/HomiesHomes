/**
 * Main App Component
 * Handles user authentication and routing
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import "./styles/Auth.css"; // Styles for login/register forms
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Favourites from "./pages/Favourites";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddProperty from "./pages/AddProperty";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import NotFound from "./pages/NotFound";
import API_BASE_URL from "./config/api";
import { hasLink } from "./services/hateoas";
import AgentDashboard from "./pages/AgentDashboard";

// Figure out user's permission level consistently
const getUserLevel = (user) => {
  if (!user) return -1;
  return user.user_levels !== undefined ? user.user_levels : user.user_level;
};

/**
 * Protect routes that need authentication
 * Redirects to home if not logged in or missing permission
 */
const ProtectedRoute = ({
  element,
  token,
  userInfo,
  requiredLevel,
  ...rest
}) => {
  if (!token || !userInfo) {
    return <Navigate to="/" replace />;
  }

  // Make sure user has high enough permissions
  if (getUserLevel(userInfo) < requiredLevel) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
};

function App() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [token, setToken] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLogin, setShowLogin] = useState(true);

  // Form state for user registration
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    user_email: "",
    user_phone: "",
    user_firstName: "",
    user_lastName: "",
  });

  // Keep track of all properties
  const [properties, setProperties] = useState([]);

  // Fetch properties from the API
  const fetchAllProperties = useCallback(async () => {
    console.log("[FETCH] App: Fetching properties");
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        console.error(
          `[FETCH] App: Error fetching properties: ${response.status}`
        );
        return false;
      }

      const data = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        console.log(
          `[FETCH] App: Successfully fetched ${data.data.length} properties`
        );
        setProperties(data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[FETCH] App: Error during fetch:", error);
      return false;
    }
  }, [token]);

  // Check saved authentication when the app starts
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Try to get the token from browser storage
        const currentToken =
          token ||
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        if (currentToken) {
          console.log("Checking token validity");
          const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentToken}`,
            },
          });

          if (!response.ok) {
            console.log("Token is invalid or expired, logging out");
            handleLogout();
            return;
          }

          const data = await response.json();
          const userData = data.data;

          if (userData) {
            console.log(
              "Token is valid, user data retrieved:",
              userData.username
            );
            setToken(currentToken);
            setUserInfo(userData);
          } else {
            console.log("No user data returned, logging out");
            handleLogout();
          }
        } else {
          console.log("No token found, continuing as guest");
        }
      } catch (error) {
        console.error("Error checking token:", error);
        handleLogout();
      }
    };

    checkToken();
  }, []); 

  // Load properties when user authentication changes
  useEffect(() => {
    console.log("Fetching initial properties");
    fetchAllProperties();
  }, [token, fetchAllProperties]);

  // Support for auto-login from URL (for testing/demo)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uname = params.get("username");
    const pwd = params.get("password");
    if (uname && pwd) {
      handleLogin(uname, pwd);
    }
  }, []);

  // Authenticate a user with username and password
  const handleLogin = async (username, password) => {
    try {
      console.log(`Attempting to login with username: ${username}`);
      setLoginError(""); // Clear any previous errors

      // Call the login API
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", res.status);

      // Parse the response
      const text = await res.text();
      console.log("Response body:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Error parsing response as JSON:", e);
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        // Show error messages
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        } else if (res.status === 400) {
          throw new Error(data.message || "Invalid login data");
        } else {
          throw new Error(data.message || "Login failed");
        }
      }

      if (data.token) {
        console.log("Login successful, received token");

        // Save the user data in app
        setUserInfo(data.user);
        setToken(data.token);
        setShowLogin(false);
        setLoginError("");

        // Keep the token for refreshing the page
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userInfo", JSON.stringify(data.user));

        // Clean up form data
        setLoginUsername("");
        setLoginPassword("");
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError(err.message || "Login failed. Please try again.");
    }
  };

  // Search for properties with specific criteria
  const handlePropertySearch = async (filters) => {
    try {
      console.log("Searching properties with filters:", filters);
      const query = new URLSearchParams(filters).toString();

      const options = {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include",
      };

      // Make the search request
      const response = await fetch(
        `${API_BASE_URL}/properties/filter`,
        options
      );

      if (!response.ok) {
        console.error(`Error fetching properties: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log("Property search response status:", response.status);
      console.log("Search data was fetched from server");

      // Look for special role-based access headers
      const hasAgentAccess = response.headers.get("X-Agent-Access") === "true";
      const hasAdminAccess = response.headers.get("X-Admin-Access") === "true";

      // Check if server sent navigation links
      const linkHeader = response.headers.get("Link");
      if (linkHeader) {
        console.log("HATEOAS Link header:", linkHeader);
      }

      // Update user permissions if the server says they've changed
      if (hasAgentAccess && userInfo && getUserLevel(userInfo) < 1) {
        console.log("Adjusting user level to Agent based on headers");
        setUserInfo({
          ...userInfo,
          user_levels: 1,
          user_level: 1,
        });
      }

      if (hasAdminAccess && userInfo && getUserLevel(userInfo) < 2) {
        console.log("Adjusting user level to Admin based on headers");
        setUserInfo({
          ...userInfo,
          user_levels: 2,
          user_level: 2,
        });
      }

      // Show the found properties
      setProperties(data.data || []);
    } catch (err) {
      console.error("Property search error:", err);
    }
  };

  // Submit the login form
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    handleLogin(loginUsername, loginPassword);
  };

  // Register a new user account
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting to register:", registerData);
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // For cross-origin cookies
        body: JSON.stringify(registerData),
      });

      console.log("Registration response status:", res.status);

      // Check for common errors
      if (!res.ok) {
        if (res.status === 0) {
          setLoginError(
            "Could not connect to server. CORS issue or server is down."
          );
          return;
        }

        // Extract the error details
        const errorData = await res.json();
        console.log("Registration error data:", errorData);

        if (res.status === 400) {
          // Show user-friendly validation errors
          const errorMessage =
            errorData.message ||
            errorData.error?.message ||
            "Registration failed";

          if (errorMessage.includes("Username already exists")) {
            setLoginError(
              "Username already exists. Please choose a different username."
            );
          } else if (errorMessage.includes("Email already in use")) {
            setLoginError(
              "Email already in use. Please use a different email address."
            );
          } else {
            setLoginError(errorMessage);
          }
        } else {
          setLoginError(errorData.message || "Registration failed");
        }
        return;
      }

      // Success - process the response
      const data = await res.json();
      console.log("Registration response:", data);

      if (data.token) {
        console.log("Registration successful, received token");

        // Set up user account with default permissions
        const user = {
          username: registerData.username,
          user_email: registerData.user_email,
          user_firstName: registerData.user_firstName || "",
          user_lastName: registerData.user_lastName || "",
          user_levels: 0,
          user_level: 0,
        };

        setUserInfo(user);
        setToken(data.token);
        setShowLogin(false); // Close the login modal
        setLoginError("");

        // Reset the form for next time
        setRegisterData({
          username: "",
          password: "",
          user_email: "",
          user_phone: "",
          user_firstName: "",
          user_lastName: "",
        });

        // Make sure we start fresh
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userInfo");
      } else {
        console.log("Registration failed, no token received", data);
        setLoginError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      setLoginError("Registration failed. Please try again.");
    }
  };

  // Save register form field changes
  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Log the user out of the system
  const handleLogout = () => {
    console.log("Logging out and clearing all storage");

    // Reset all authentication state
    setToken("");
    setUserInfo(null);
    setShowLogin(true);

    // Clear login form fields
    setLoginUsername("");
    setLoginPassword("");

    // Clear registration form too if needed
    setRegisterData({
      username: "",
      password: "",
      user_email: "",
      user_phone: "",
      user_firstName: "",
      user_lastName: "",
    });

    // Remove stored credentials
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userInfo");

    // Go back to homepage
    window.location.href = "/";
  };

  // Properties page that uses our central property data
  const PropertiesRoute = () => {
    return (
      <Properties
        properties={properties}
        token={token}
        userInfo={userInfo}
        refreshProperties={fetchAllProperties}
      />
    );
  };

  // Show the right dashboard based on user role
  const getDashboardComponent = () => {
    if (!userInfo) return <Navigate to="/" />;

    const userLevel = getUserLevel(userInfo);

    if (userLevel >= 2) {
      return <AdminDashboard token={token} userInfo={userInfo} />;
    } else if (userLevel === 1) {
      return <UserDashboard token={token} userInfo={userInfo} />;
    } else {
      return <UserDashboard token={token} userInfo={userInfo} />;
    }
  };

  return (
    <Router>
      <div className="App">
        <Header userInfo={userInfo} onLogout={handleLogout} />

        {/* Show login/register form when not logged in */}
        {showLogin && !userInfo && (
          <LoginModal
            isRegistering={isRegistering}
            loginUsername={loginUsername}
            loginPassword={loginPassword}
            registerData={registerData}
            loginError={loginError}
            onLoginUsernameChange={(e) => setLoginUsername(e.target.value)}
            onLoginPasswordChange={(e) => setLoginPassword(e.target.value)}
            onRegisterChange={handleRegisterInputChange}
            onSubmit={isRegistering ? handleRegister : handleLoginSubmit}
            onToggleMode={() => setIsRegistering(!isRegistering)}
          />
        )}

        {/* Main app routes - only show when login modal is closed */}
        {!showLogin && (
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  onSearch={handlePropertySearch}
                  token={token}
                  userInfo={userInfo}
                />
              }
            />
            <Route path="/properties" element={<PropertiesRoute />} />
            <Route
              path="/property/:id"
              element={<PropertyDetails token={token} userInfo={userInfo} />}
            />
            <Route
              path="/favourites"
              element={
                <ProtectedRoute
                  element={<Favourites token={token} userInfo={userInfo} />}
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={0}
                />
              }
            />
            <Route
              path="/AddProperty"
              element={
                <ProtectedRoute
                  element={
                    <AddProperty
                      token={token}
                      userInfo={userInfo}
                      onPropertyUpdate={fetchAllProperties}
                    />
                  }
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={1}
                />
              }
            />
            <Route
              path="/editProperty/:id"
              element={
                <ProtectedRoute
                  element={
                    <AddProperty
                      token={token}
                      userInfo={userInfo}
                      isEditing={true}
                      onPropertyUpdate={fetchAllProperties}
                    />
                  }
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={1}
                />
              }
            />

            {/* Dashboard routes for different user types */}
            <Route
              path="/dashboard"
              element={userInfo ? getDashboardComponent() : <Navigate to="/" />}
            />
            <Route
              path="/agent-dashboard/*"
              element={
                <ProtectedRoute
                  element={<AgentDashboard token={token} userInfo={userInfo} />}
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={1}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  element={<AdminDashboard token={token} userInfo={userInfo} />}
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={2}
                />
              }
            />

            {/* Handle any unexpected URLs */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
