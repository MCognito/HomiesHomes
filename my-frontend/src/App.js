import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Favourites from "./pages/Favourites";
import AddProperty from "./pages/AddProperty";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import UserDashboard from "./pages/UserDashboard";
import "@fontsource/poppins";
import "./App.css";
import "./styles/Dashboard.css";

// Define API base URL - ensure it matches your backend port
const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

// Role-based route component
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

  // Check if user has required access level
  if (userInfo.user_level < requiredLevel) {
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

  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    user_email: "",
    user_phone: "",
    user_firstName: "",
    user_lastName: "",
  });

  const [properties, setProperties] = useState([]);

  // Auto-login from URL params (for demo/testing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uname = params.get("username");
    const pwd = params.get("password");
    if (uname && pwd) {
      handleLogin(uname, pwd);
    }
  }, []);

  const handleLogin = async (username, password) => {
    try {
      console.log(`Attempting to login with username: ${username}`);

      // Send login request with credentials
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials for cross-origin requests
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", res.status);

      // Handle unauthorized or other error statuses
      if (!res.ok) {
        if (res.status === 401) {
          setLoginError("Invalid username or password");
          return;
        }
        if (res.status === 0) {
          setLoginError(
            "Could not connect to server. CORS issue or server is down."
          );
          return;
        }
      }

      // Try to read the response body regardless of status
      const text = await res.text();
      console.log("Response body:", text);

      let data;
      try {
        // Try to parse as JSON if possible
        data = JSON.parse(text);
      } catch (e) {
        console.error("Error parsing response as JSON:", e);
        // If not JSON, just use the text
        data = { message: text || "Unknown server response" };
      }

      if (data.token) {
        console.log("Login successful, received token");
        setUserInfo(data.user);
        setToken(data.token);
        setShowLogin(false);
        setLoginError("");
      } else {
        console.log("Login failed, no token received", data);
        setLoginError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError(
        "Server error. Please check if your backend server is running. " +
          err.message
      );
    }
  };

  const handlePropertySearch = async (filters) => {
    try {
      console.log("Searching properties with filters:", filters);
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE_URL}/properties?${query}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials for cross-origin requests
      });

      console.log("Property search response status:", res.status);

      if (!res.ok) {
        console.error(`Error fetching properties: ${res.status}`);
        return;
      }

      // Check for role-based headers
      const hasAgentAccess = res.headers.get("X-Agent-Access") === "true";
      const hasAdminAccess = res.headers.get("X-Admin-Access") === "true";

      // Get Link header if present (RFC 8288 format)
      const linkHeader = res.headers.get("Link");
      if (linkHeader) {
        console.log("HATEOAS Link header:", linkHeader);
      }

      const data = await res.json();

      // Update user permissions based on response headers if needed
      if (hasAgentAccess && userInfo && userInfo.user_level < 1) {
        console.log("Adjusting user level to Agent based on headers");
        setUserInfo({ ...userInfo, user_level: 1 });
      }

      if (hasAdminAccess && userInfo && userInfo.user_level < 2) {
        console.log("Adjusting user level to Admin based on headers");
        setUserInfo({ ...userInfo, user_level: 2 });
      }

      if (data.data) {
        setProperties(data.data);
        console.log("Properties loaded:", data.data.length);

        // Also store the HATEOAS links from the response if present
        if (data._links) {
          console.log("HATEOAS links in response:", data._links);
        }
      }
    } catch (err) {
      console.error("Property Search Error:", err);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    handleLogin(loginUsername, loginPassword);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting to register:", registerData);
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include credentials for cross-origin requests
        body: JSON.stringify(registerData),
      });

      console.log("Registration response status:", res.status);

      // Handle error statuses
      if (!res.ok) {
        if (res.status === 0) {
          setLoginError(
            "Could not connect to server. CORS issue or server is down."
          );
          return;
        }
      }

      // Try to read response
      const text = await res.text();
      console.log("Response body:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Error parsing response as JSON:", e);
        data = { message: text || "Unknown server response" };
      }

      if (data.token) {
        console.log("Registration successful, received token");
        setUserInfo(data.user);
        setToken(data.token);
        setShowLogin(false);
        setLoginError("");
      } else {
        console.log("Registration failed, no token received", data);
        setLoginError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration Error:", err);
      setLoginError("Server error: " + err.message);
    }
  };

  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleLogout = () => {
    setUserInfo(null);
    setToken("");
    setShowLogin(true);
    setLoginUsername("");
    setLoginPassword("");
    setProperties([]);
  };

  // Fetch properties with HATEOAS links
  useEffect(() => {
    if (userInfo && token) {
      const fetchProperties = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/properties`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.data) {
            const enriched = data.data.map((prop) => ({
              ...prop,
              linkSelf: `${API_BASE_URL}${
                prop.links?.self || `/properties/${prop.id}`
              }`,
              linkUpdate: `${API_BASE_URL}${
                prop.links?.update || `/properties/${prop.id}`
              }`,
              linkDelete: `${API_BASE_URL}${
                prop.links?.delete || `/properties/${prop.id}`
              }`,
            }));
            setProperties(enriched);
          }
        } catch (err) {
          console.error("Fetch Properties Error:", err);
        }
      };

      fetchProperties();
    }
  }, [userInfo, token]);

  // Fetch all properties for the Properties page
  const fetchAllProperties = async () => {
    try {
      console.log("Fetching all properties");

      const res = await fetch(`${API_BASE_URL}/properties`, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "default", // Use browser cache when possible
      });

      if (!res.ok) {
        console.error(`Error fetching properties: ${res.status}`);
        return;
      }

      const data = await res.json();

      if (data.data) {
        console.log(`Loaded ${data.data.length} properties`);
        setProperties(data.data);
      }
    } catch (err) {
      console.error("Error fetching all properties:", err);
    }
  };

  // Add useEffect to update properties when token changes
  useEffect(() => {
    if (token) {
      fetchAllProperties();
    }
  }, [token]);

  // Route component for Properties that ensures fresh data
  const PropertiesRoute = () => {
    // No need to call fetchAllProperties here again
    return (
      <Properties properties={properties} token={token} userInfo={userInfo} />
    );
  };

  // Get appropriate dashboard component based on user level
  const getDashboardComponent = () => {
    if (!userInfo) return <Navigate to="/" />;

    if (userInfo.user_level >= 2) {
      return <AdminDashboard token={token} userInfo={userInfo} />;
    } else if (userInfo.user_level === 1) {
      return <AgentDashboard token={token} userInfo={userInfo} />;
    } else {
      return <UserDashboard token={token} userInfo={userInfo} />;
    }
  };

  return (
    <Router>
      <div className="App">
        <Header userInfo={userInfo} onLogout={handleLogout} />

        {showLogin && (
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
                  element={<AddProperty token={token} userInfo={userInfo} />}
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
                    />
                  }
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={1}
                />
              }
            />

            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={userInfo ? getDashboardComponent() : <Navigate to="/" />}
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
            <Route
              path="/agent"
              element={
                <ProtectedRoute
                  element={<AgentDashboard token={token} userInfo={userInfo} />}
                  token={token}
                  userInfo={userInfo}
                  requiredLevel={1}
                />
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
