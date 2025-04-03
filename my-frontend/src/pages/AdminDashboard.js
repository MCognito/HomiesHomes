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
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

const AdminDashboard = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "properties") {
      fetchProperties();
    }
  }, [activeTab, token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      setErrorMessage("Error fetching users: " + err.message);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch properties");
      }

      const data = await res.json();
      setProperties(data.data || []);
    } catch (err) {
      setErrorMessage("Error fetching properties: " + err.message);
    }
  };

  const handleRoleChange = async (userId, newLevel) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_levels: newLevel }),
      });

      if (!res.ok) {
        throw new Error("Failed to update user role");
      }

      setSuccessMessage("User role updated successfully");
      fetchUsers(); // Refresh the users list
    } catch (err) {
      setErrorMessage("Error updating user role: " + err.message);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete property");
      }

      setSuccessMessage("Property deleted successfully");
      fetchProperties(); // Refresh the properties list
    } catch (err) {
      setErrorMessage("Error deleting property: " + err.message);
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

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="users-section">
          <h2>Users</h2>
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
                    {user.user_levels === 0
                      ? "User"
                      : user.user_levels === 1
                      ? "Agent"
                      : "Admin"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.user_levels < 2 && (
                        <button
                          onClick={() =>
                            handleRoleChange(
                              user.user_id,
                              user.user_levels === 0 ? 1 : 0
                            )
                          }
                          title={
                            user.user_levels === 0
                              ? "Promote to Agent"
                              : "Demote to User"
                          }
                        >
                          <FontAwesomeIcon icon={faLevelUp} />
                          {user.user_levels === 0
                            ? " Make Agent"
                            : " Make User"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="properties-section">
          <h2>Properties</h2>
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
                        <FontAwesomeIcon icon={faHome} />
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
      )}
    </div>
  );
};

export default AdminDashboard;
