import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserTie,
  faHome,
  faEdit,
  faTrash,
  faUserPlus,
  faLevelUp,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faUserSlash,
  faSync,
  faCheck,
  faTimes,
  faSpinner,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL from "../config/api";
import "../styles/AdminDashboard.css";

const AdminDashboard = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agentRequests, setAgentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [responseReason, setResponseReason] = useState("");
  const [actionUser, setActionUser] = useState(null);

  // Added debug states to track operations
  const [lastAction, setLastAction] = useState(null);
  const [lastActionTime, setLastActionTime] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "properties") {
      fetchProperties();
    } else if (activeTab === "agent-requests") {
      fetchAgentRequests();
    }
  }, [activeTab, token]);

  // Set up an auto-refresh mechanism
  useEffect(() => {
    let refreshInterval;

    if (autoRefresh) {
      // Refresh active data every 30 seconds
      refreshInterval = setInterval(() => {
        console.log(`Auto-refreshing ${activeTab} data...`);
        setLastRefreshTime(new Date().toLocaleTimeString());

        if (activeTab === "users") {
          fetchUsers(true); // true = silent refresh
        } else if (activeTab === "properties") {
          fetchProperties(true);
        } else if (activeTab === "agent-requests") {
          fetchAgentRequests(true);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, activeTab]);

  // Debug effect to log when the component updates
  useEffect(() => {
    console.log("AdminDashboard component updated");
    console.log("Current user count:", users.length);
    console.log("Current property count:", properties.length);
    console.log("Current agent request count:", agentRequests.length);
  }, [users, properties, agentRequests]);

  const fetchUsers = async (silent = false) => {
    try {
      console.log("Fetching users...");
      if (!silent) setIsLoading(true);
      setErrorMessage("");

      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Prevent caching to always get fresh data
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch users (${res.status})`);
      }

      const data = await res.json();
      console.log(`Fetched ${data.data?.length || 0} users`);
      setUsers(data.data || []);

      // Log user roles for debugging
      data.data?.forEach((user) => {
        console.log(
          `User ${user.username} (ID: ${user.user_id}) has role level: ${user.user_levels}`
        );
      });

      if (!silent) setIsLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setErrorMessage("Error fetching users: " + err.message);
      if (!silent) setIsLoading(false);
    }
  };

  const fetchProperties = async (silent = false) => {
    try {
      console.log("Fetching properties...");
      if (!silent) setIsLoading(true);
      setErrorMessage("");

      const res = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch properties (${res.status})`);
      }

      const data = await res.json();
      console.log(`Fetched ${data.data?.length || 0} properties`);
      setProperties(data.data || []);
      if (!silent) setIsLoading(false);
    } catch (err) {
      console.error("Error fetching properties:", err);
      setErrorMessage("Error fetching properties: " + err.message);
      if (!silent) setIsLoading(false);
    }
  };

  const fetchAgentRequests = async (silent = false) => {
    try {
      console.log("Fetching agent requests...");
      if (!silent) setIsLoading(true);
      setErrorMessage("");

      const res = await fetch(`${API_BASE_URL}/agent-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      // Log the response status to debug
      console.log("Agent requests response status:", res.status);

      // If response is not ok, get the error message from the response
      if (!res.ok) {
        const errorData = await res.text();
        console.error("Error response body:", errorData);
        throw new Error(
          `Failed to fetch agent requests (${res.status}): ${errorData}`
        );
      }

      const data = await res.json();
      console.log("Agent requests data:", data);

      // Extract the agent requests from the data structure
      const requests = data.data || data;

      // Update state with the requests
      setAgentRequests(Array.isArray(requests) ? requests : []);
      console.log(
        "Number of agent requests loaded:",
        Array.isArray(requests) ? requests.length : 0
      );
    } catch (err) {
      console.error("Error fetching agent requests:", err);
      setErrorMessage("Error fetching agent requests: " + err.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId, newLevel) => {
    try {
      console.log(`Changing role for user ${userId} to level ${newLevel}`);
      setErrorMessage("");
      setIsLoading(true);
      setSuccessMessage(""); // Clear previous success message
      setLastAction(`Promoting user ${userId} to level ${newLevel}`);
      setLastActionTime(new Date().toISOString());

      const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_levels: newLevel }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update user role (${res.status})`);
      }

      const data = await res.json();
      console.log("Role change response:", data);

      // Store the updated token and user data for the promoted user
      if (data.token) {
        localStorage.setItem(`updated_token_${userId}`, data.token);
        if (data.user) {
          localStorage.setItem(
            `updated_user_${userId}`,
            JSON.stringify(data.user)
          );
        }
      }

      // Immediately update the local state to reflect the changes
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId ? { ...user, user_levels: newLevel } : user
        )
      );

      console.log("Users state updated after role change");

      // Set success message after the state is updated
      setSuccessMessage("User role updated successfully");

      // Force a complete refresh of users data
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user role:", err);
      setErrorMessage("Error updating user role: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    // Confirm before deleting
    if (
      !window.confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log(`Deleting property ${propertyId}`);
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage(""); // Clear previous success message
      setLastAction(`Deleting property ${propertyId}`);
      setLastActionTime(new Date().toISOString());

      const res = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if the property was not found (already deleted)
      if (res.status === 404) {
        // Property doesn't exist (perhaps already deleted)
        console.log(`Property ${propertyId} already deleted or doesn't exist`);

        // Remove from local state to update UI
        setProperties((prevProperties) =>
          prevProperties.filter((prop) => prop.id !== propertyId)
        );

        setSuccessMessage(
          "Property removed from dashboard. May have already been deleted."
        );

        // Refresh properties list
        setTimeout(async () => {
          try {
            await fetchProperties();
          } finally {
            setIsLoading(false);
          }
        }, 1000);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to delete property (${res.status})`);
      }

      console.log(`Property ${propertyId} deleted successfully`);

      // Update the UI immediately for a responsive feel
      setProperties((prevProperties) =>
        prevProperties.filter((prop) => prop.id !== propertyId)
      );

      setSuccessMessage("Property deleted successfully");

      // Wait to ensure deletion is complete on the backend
      setTimeout(async () => {
        try {
          console.log("Refreshing property list after deletion");
          await fetchProperties();
        } catch (refreshErr) {
          console.error(
            "Error refreshing properties after deletion:",
            refreshErr
          );
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1 second delay to ensure backend processing is complete
    } catch (err) {
      console.error("Error deleting property:", err);
      setErrorMessage(`Error deleting property: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      console.log(`Approving agent request ${requestId}`);
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage(""); // Clear previous success message
      setLastAction(`Approving agent request ${requestId}`);
      setLastActionTime(new Date().toISOString());

      // Update the agent request status to approved
      const response = await fetch(
        `${API_BASE_URL}/agent-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "approved" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to approve agent request (${response.status}): ${errorData}`
        );
      }

      console.log(`Agent request ${requestId} approved successfully`);

      // Update the UI immediately for a responsive feel
      setAgentRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.request_id === parseInt(requestId)
            ? { ...req, status: "approved", response_date: new Date() }
            : req
        )
      );

      setSuccessMessage("Agent request approved successfully");

      // Wait a moment to ensure changes are complete on the backend
      setTimeout(async () => {
        try {
          console.log("Refreshing agent requests after approval");
          await fetchAgentRequests();

          // Also refresh users since roles have changed
          await fetchUsers();
        } catch (refreshErr) {
          console.error("Error refreshing data after approval:", refreshErr);
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1 second delay to ensure backend processing is complete
    } catch (err) {
      console.error("Error approving agent request:", err);
      setErrorMessage(`Error approving agent request: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log(`Rejecting agent request ${requestId}`);
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage(""); // Clear previous success message
      setLastAction(`Rejecting agent request ${requestId}`);
      setLastActionTime(new Date().toISOString());

      // Update the agent request status to rejected
      const response = await fetch(
        `${API_BASE_URL}/agent-requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "rejected" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to reject agent request (${response.status}): ${errorData}`
        );
      }

      console.log(`Agent request ${requestId} rejected successfully`);

      // Update the UI immediately for a responsive feel
      setAgentRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.request_id === parseInt(requestId)
            ? { ...req, status: "rejected", response_date: new Date() }
            : req
        )
      );

      setSuccessMessage("Agent request rejected successfully");

      // Wait a moment to ensure rejection is complete on the backend
      setTimeout(async () => {
        try {
          console.log("Refreshing agent requests after rejection");
          await fetchAgentRequests();
        } catch (refreshErr) {
          console.error(
            "Error refreshing requests after rejection:",
            refreshErr
          );
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1 second delay to ensure backend processing is complete
    } catch (err) {
      console.error("Error rejecting agent request:", err);
      setErrorMessage(`Error rejecting agent request: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Don't allow deleting the admin itself
    const adminUser = users.find((u) => u.user_levels === 2);
    if (adminUser && adminUser.user_id === userId) {
      setErrorMessage("Cannot delete admin user");
      return;
    }

    // Confirm before deleting
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      console.log(`Deleting user ${userId}`);
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage(""); // Clear previous success message
      setLastAction(`Deleting user ${userId}`);
      setLastActionTime(new Date().toISOString());

      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if the user was not found (already deleted)
      if (res.status === 404) {
        // User doesn't exist (perhaps already deleted)
        console.log(`User ${userId} already deleted or doesn't exist`);

        // Remove from local state to update UI
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.user_id !== userId)
        );

        setSuccessMessage(
          "User removed from dashboard. May have already been deleted."
        );

        // Refresh users list
        setTimeout(async () => {
          try {
            await fetchUsers();
          } finally {
            setIsLoading(false);
          }
        }, 1000);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to delete user (${res.status})`);
      }

      console.log(`User ${userId} deleted successfully`);

      // Update the UI immediately for a responsive feel
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== userId)
      );

      setSuccessMessage("User deleted successfully");

      // Wait to ensure deletion is complete on the backend
      setTimeout(async () => {
        try {
          console.log("Refreshing user list after deletion");
          await fetchUsers();
        } catch (refreshErr) {
          console.error("Error refreshing users after deletion:", refreshErr);
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1 second delay to ensure backend processing is complete
    } catch (err) {
      console.error("Error deleting user:", err);
      setErrorMessage(`Error deleting user: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Added helper to render user role
  const renderUserRole = (level) => {
    switch (level) {
      case 0:
        return "User";
      case 1:
        return "Agent";
      case 2:
        return "Admin";
      default:
        return `Unknown (${level})`;
    }
  };

  const prepareAgentRequestAction = (userId, action) => {
    setActionUser(userId);
    setResponseReason("");

    // Open the modal
    document.getElementById("responseModal").style.display = "block";
  };

  const closeModal = () => {
    document.getElementById("responseModal").style.display = "none";
    setActionUser(null);
    setResponseReason("");
  };

  const handleAgentRequestAction = async (action) => {
    if (!actionUser) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/agent-request/${actionUser}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ response_reason: responseReason }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to ${action} agent request`);
      }

      // Refresh the agent requests
      fetchAgentRequests();
      closeModal();
      alert(
        `Agent request ${
          action === "accept" ? "approved" : "rejected"
        } successfully`
      );
    } catch (err) {
      console.error(`Error ${action}ing agent request:`, err);
      alert(`Failed to ${action} agent request. Please try again.`);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <FontAwesomeIcon icon={faUser} /> Manage Users
        </button>
        <button
          className={`tab-btn ${activeTab === "properties" ? "active" : ""}`}
          onClick={() => setActiveTab("properties")}
        >
          <FontAwesomeIcon icon={faHome} /> Manage Properties
        </button>
        <button
          className={`tab-btn ${
            activeTab === "agent-requests" ? "active" : ""
          }`}
          onClick={() => setActiveTab("agent-requests")}
        >
          <FontAwesomeIcon icon={faUserTie} /> Agent Requests
        </button>

        {/* Manual Refresh Button */}
        <button
          className="refresh-btn"
          onClick={() => {
            if (activeTab === "users") {
              fetchUsers();
            } else if (activeTab === "properties") {
              fetchProperties();
            } else if (activeTab === "agent-requests") {
              fetchAgentRequests();
            }
          }}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faSync} /> Refresh
        </button>

        {/* Auto-refresh Toggle */}
        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
          />
          Auto-refresh
        </label>
      </div>

      {/* Debug Info and Refresh Status */}
      <div className="debug-info">
        {lastAction && (
          <p>
            Last action: {lastAction} at {lastActionTime}
          </p>
        )}
        {lastRefreshTime && (
          <p>
            Last data refresh: {lastRefreshTime}
            {autoRefresh && " (Auto-refresh enabled)"}
          </p>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
          <button onClick={() => setErrorMessage("")}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage("")}>×</button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="users-section">
          <h2>Users</h2>

          {users.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faUser} className="empty-state-icon" />
              <p>No users found.</p>
            </div>
          ) : (
            <>
              {/* Table view for desktop */}
              <div className="desktop-view">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td>{user.username}</td>
                        <td>{user.user_email}</td>
                        <td>
                          {user.user_firstName} {user.user_lastName}
                        </td>
                        <td>
                          <span
                            className={`role-status ${renderUserRole(
                              user.user_levels
                            ).toLowerCase()}`}
                          >
                            {renderUserRole(user.user_levels)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {user.user_levels === 0 && (
                              <button
                                onClick={() =>
                                  handleRoleChange(user.user_id, 1)
                                }
                                title="Promote to Agent"
                                className="promote-btn"
                                disabled={isLoading}
                              >
                                <FontAwesomeIcon icon={faLevelUp} /> Promote
                              </button>
                            )}
                            {user.user_levels !== 2 && (
                              <button
                                onClick={() => handleDeleteUser(user.user_id)}
                                title="Delete User"
                                className="delete-btn"
                                disabled={isLoading}
                              >
                                <FontAwesomeIcon icon={faUserSlash} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card view for mobile */}
              <div className="users-card-view mobile-view">
                {users.map((user) => (
                  <div className="user-card" key={user.user_id}>
                    <div className="user-card-header">
                      <h3 className="user-name">{user.username}</h3>
                      <span
                        className={`role-status ${renderUserRole(
                          user.user_levels
                        ).toLowerCase()}`}
                      >
                        {renderUserRole(user.user_levels)}
                      </span>
                    </div>
                    <div className="user-card-body">
                      <div className="user-info">
                        <div className="user-info-row">
                          <span className="user-info-label">Name:</span>
                          <span className="user-info-value">
                            {user.user_firstName} {user.user_lastName}
                          </span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">Email:</span>
                          <span className="user-info-value">
                            {user.user_email}
                          </span>
                        </div>
                        <div className="user-info-row">
                          <span className="user-info-label">ID:</span>
                          <span className="user-info-value">
                            {user.user_id}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="user-card-actions">
                      {user.user_levels === 0 && (
                        <button
                          onClick={() => handleRoleChange(user.user_id, 1)}
                          title="Promote to Agent"
                          className="promote-btn"
                          disabled={isLoading}
                        >
                          <FontAwesomeIcon icon={faLevelUp} /> Promote to Agent
                        </button>
                      )}
                      {user.user_levels !== 2 && (
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          title="Delete User"
                          className="delete-btn"
                          disabled={isLoading}
                        >
                          <FontAwesomeIcon icon={faUserSlash} /> Delete User
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="properties-section">
          <h2>Properties</h2>

          {properties.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faHome} className="empty-state-icon" />
              <p>No properties found.</p>
            </div>
          ) : (
            <>
              {/* Table view for desktop */}
              <div className="desktop-view">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Location</th>
                      <th>Agent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id}>
                        <td>{property.id}</td>
                        <td>{property.title}</td>
                        <td>£{parseFloat(property.price).toLocaleString()}</td>
                        <td>{property.location}</td>
                        <td>{property.agent_id}</td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/property/${property.id}`}
                              className="view-btn"
                              title="View Property"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Link>
                            <Link
                              to={`/editProperty/${property.id}`}
                              className="edit-btn"
                              title="Edit Property"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              className="delete-btn"
                              title="Delete Property"
                              disabled={isLoading}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card view for mobile */}
              <div className="properties-card-view mobile-view">
                {properties.map((property) => (
                  <div className="property-card" key={property.id}>
                    <div className="property-card-header">
                      <h3 className="property-title">{property.title}</h3>
                      <p className="property-location">{property.location}</p>
                    </div>
                    <div className="property-card-body">
                      <p className="property-price">
                        £{parseFloat(property.price).toLocaleString()}
                      </p>
                      <p className="property-agent">
                        Agent ID: {property.agent_id}
                      </p>
                    </div>
                    <div className="property-card-actions">
                      <Link
                        to={`/property/${property.id}`}
                        className="view-btn"
                        title="View Property"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <Link
                        to={`/editProperty/${property.id}`}
                        className="edit-btn"
                        title="Edit Property"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="delete-btn"
                        title="Delete Property"
                        disabled={isLoading}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Agent Requests Tab */}
      {activeTab === "agent-requests" && (
        <div className="agent-requests-section">
          <h2>Agent Requests</h2>

          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading agent requests...</p>
            </div>
          ) : agentRequests.length === 0 ? (
            <p className="no-requests">
              No pending agent requests at this time.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agentRequests.map((request) => (
                  <tr key={request.request_id}>
                    <td>{request.request_id}</td>
                    <td>{request.username}</td>
                    <td>{request.user_email}</td>
                    <td>
                      {request.user_firstName} {request.user_lastName}
                    </td>
                    <td>{new Date(request.request_date).toLocaleString()}</td>
                    <td>
                      <span className={`status-${request.status}`}>
                        {request.status === "pending" && (
                          <>
                            <FontAwesomeIcon icon={faClock} /> Pending
                          </>
                        )}
                        {request.status === "approved" && (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} /> Approved
                          </>
                        )}
                        {request.status === "rejected" && (
                          <>
                            <FontAwesomeIcon icon={faTimesCircle} /> Rejected
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      {request.status === "pending" && (
                        <div className="action-buttons">
                          <button
                            className="approve-btn"
                            onClick={() =>
                              handleApproveRequest(request.request_id)
                            }
                            title="Approve Request"
                            disabled={isLoading}
                          >
                            <FontAwesomeIcon icon={faCheckCircle} /> Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() =>
                              handleRejectRequest(request.request_id)
                            }
                            title="Reject Request"
                            disabled={isLoading}
                          >
                            <FontAwesomeIcon icon={faTimesCircle} /> Reject
                          </button>
                          <button
                            className="view-reason-btn"
                            onClick={() =>
                              alert(`Reason: ${request.request_reason}`)
                            }
                            title="View Reason"
                          >
                            <FontAwesomeIcon icon={faEye} /> View Reason
                          </button>
                        </div>
                      )}
                      {request.status !== "pending" && (
                        <>
                          <span className="response-date">
                            {request.response_date
                              ? `Responded on ${new Date(
                                  request.response_date
                                ).toLocaleString()}`
                              : "No response date"}
                          </span>
                          <button
                            className="view-reason-btn"
                            onClick={() =>
                              alert(`Reason: ${request.request_reason}`)
                            }
                            title="View Reason"
                            style={{ marginLeft: "10px" }}
                          >
                            <FontAwesomeIcon icon={faEye} /> View Reason
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal for response reason */}
      <div id="responseModal" className="modal">
        <div className="modal-content">
          <span className="close" onClick={closeModal}>
            &times;
          </span>
          <h2>Provide Response Reason</h2>
          <textarea
            value={responseReason}
            onChange={(e) => setResponseReason(e.target.value)}
            placeholder="Enter reason for approval/rejection (optional)"
            rows="4"
          ></textarea>
          <div className="modal-buttons">
            <button
              onClick={() => handleAgentRequestAction("accept")}
              className="approve-btn"
            >
              Approve Request
            </button>
            <button
              onClick={() => handleAgentRequestAction("reject")}
              className="reject-btn"
            >
              Reject Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
