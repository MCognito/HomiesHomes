import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCalendarAlt,
  faEdit,
  faTrash,
  faPlus,
  faCheck,
  faTimes,
  faUsers,
  faSort,
  faCalendarCheck,
  faCalendarDay,
  faCalendarWeek,
  faFilter,
  faSync,
  faHeart,
  faSearch,
  faClock,
  faUser,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

import API_BASE_URL from "../config/api";

// Import the default image
import defaultImage from "../assets/prop1.jpg";
import prop1 from "../assets/prop1.jpg";

// Image map for imported images
const imageMap = {
  "prop1.jpg": prop1,
};

const AgentDashboard = ({ token, userInfo }) => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("properties");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [viewMode, setViewMode] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (activeTab === "properties") {
      fetchAgentProperties();
    } else if (activeTab === "bookings") {
      fetchAgentBookings();
    } else if (activeTab === "favorites") {
      fetchAgentFavorites();
    }
  }, [activeTab, token, sortOption]);

  const fetchAgentProperties = async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);

      if (!userInfo || !userInfo.user_id) {
        setErrorMessage("User information not available");
        return;
      }

      console.log(`Fetching properties for agent ID: ${userInfo.user_id}`);

      const res = await fetch(
        `${API_BASE_URL}/properties?agent_id=${userInfo.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          cache: "no-cache",
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch properties (${res.status})`);
      }

      const data = await res.json();
      console.log(
        `Found ${data.data ? data.data.length : 0} properties for agent ID ${
          userInfo.user_id
        }`
      );
      setProperties(data.data || []);
    } catch (err) {
      console.error("Error fetching agent properties:", err);
      setErrorMessage("Error fetching properties: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentBookings = async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);
      console.log("Fetching bookings for agent:", userInfo?.user_id);

      // Build query parameters for sorting
      let queryParams = new URLSearchParams();

      switch (sortOption) {
        case "latest":
          queryParams.append("sort", "date_desc");
          break;
        case "oldest":
          queryParams.append("sort", "date_asc");
          break;
        default:
          break;
      }

      const res = await fetch(
        `${API_BASE_URL}/bookings?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          cache: "no-cache",
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch bookings (${res.status})`);
      }

      const data = await res.json();
      console.log("Fetched bookings:", data);
      setBookings(data.data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setErrorMessage("Error fetching bookings: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/favourites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error fetching favorites: ${response.status}`);
      }

      const data = await response.json();
      setFavorites(data.data || []);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setErrorMessage("Unable to load your favorites at this time.");
    } finally {
      setIsLoading(false);
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
      fetchAgentProperties(); // Refresh the properties list
    } catch (err) {
      setErrorMessage("Error deleting property: " + err.message);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    // Show confirmation dialog with specific message for the action
    let actionText =
      newStatus === "confirmed"
        ? "confirm"
        : newStatus === "cancelled"
        ? "cancel"
        : "mark as attended";
    const confirmMessage = `Are you sure you want to ${actionText} this viewing appointment?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");

      // Ensure bookingId is a number
      const sanitizedBookingId = parseInt(bookingId, 10);

      if (isNaN(sanitizedBookingId) || sanitizedBookingId <= 0) {
        setErrorMessage("Invalid booking ID");
        return;
      }

      // Validate the status before sending
      if (
        !["pending", "confirmed", "cancelled", "attended"].includes(newStatus)
      ) {
        setErrorMessage(`Invalid status: ${newStatus}`);
        return;
      }

      console.log(`Updating booking ${sanitizedBookingId} to ${newStatus}`);

      // Sanitize inputs before sending
      const sanitizedStatus = newStatus.trim();

      const res = await fetch(
        `${API_BASE_URL}/bookings/${sanitizedBookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ status: sanitizedStatus }),
        }
      );

      // Check if there was a network or server error
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          `Failed to update booking to ${newStatus} (${res.status}): ${
            data.error || "Unknown error"
          }`
        );
      }

      const data = await res.json();

      if (data.success) {
        const actionPerformed =
          newStatus === "confirmed"
            ? "confirmed"
            : newStatus === "cancelled"
            ? "cancelled"
            : "marked as attended";
        setSuccessMessage(
          `Viewing appointment ${actionPerformed} successfully`
        );

        // Refresh the bookings list after a short delay
        setTimeout(fetchAgentBookings, 500);
      } else {
        throw new Error(data.error || "Failed to update appointment status");
      }
    } catch (err) {
      console.error("Error updating booking status:", err);
      setErrorMessage(`Error updating appointment: ${err.message}`);
    }
  };

  // Helper function to check if a date is in the past
  const isPastDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const bookingDate = new Date(dateString);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate < today;
  };

  // Add helper function to check if a specific date and time is in the past
  const isPastDateTime = (dateString, timeString) => {
    const now = new Date();
    const [hours, minutes] = timeString
      .split(":")
      .map((num) => parseInt(num, 10));
    const bookingDateTime = new Date(dateString);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    return bookingDateTime < now;
  };

  // Helper function to check if a date is within the next 7 days
  const isUpcoming = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(dateString);
    bookingDate.setHours(0, 0, 0, 0);

    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    return bookingDate >= today && bookingDate <= oneWeekFromNow;
  };

  // Filter bookings based on the selected view mode
  const getFilteredBookings = () => {
    if (viewMode === "all") {
      return bookings;
    }

    if (viewMode === "completed") {
      return bookings.filter(
        (booking) =>
          booking.booking_status === "attended" ||
          (booking.booking_status === "confirmed" &&
            isPastDateTime(booking.scheduled_date, booking.scheduled_time))
      );
    }

    if (viewMode === "upcoming") {
      return bookings.filter(
        (booking) =>
          booking.booking_status === "confirmed" &&
          isUpcoming(booking.scheduled_date) &&
          !isPastDateTime(booking.scheduled_date, booking.scheduled_time)
      );
    }

    if (viewMode === "later") {
      return bookings.filter(
        (booking) =>
          booking.booking_status === "confirmed" &&
          !isUpcoming(booking.scheduled_date) &&
          !isPastDateTime(booking.scheduled_date, booking.scheduled_time)
      );
    }

    if (viewMode === "pending") {
      return bookings.filter((booking) => booking.booking_status === "pending");
    }

    if (viewMode === "cancelled") {
      return bookings.filter(
        (booking) => booking.booking_status === "cancelled"
      );
    }

    return bookings;
  };

  // Get filtered bookings based on current view mode
  const filteredBookings = getFilteredBookings();

  // Helper function to get the correct image path
  const getImageSource = (imagePath) => {
    // If no image path is provided, use default
    if (!imagePath) return defaultImage;

    // If it's already a full URL
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // Check if we have this image in our map (imported images)
    if (imageMap[imagePath]) {
      return imageMap[imagePath];
    }

    // For images stored on the backend server
    const serverPath = `${API_BASE_URL}/images/${imagePath}`;

    // Return the server path
    return serverPath;
  };

  const handleRemoveFavorite = async (propertyId) => {
    if (!window.confirm("Remove this property from your favorites?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/favourites/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to remove from favorites");
      }

      setSuccessMessage("Property removed from favorites");
      // Refresh favorites list
      fetchAgentFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      setErrorMessage("Failed to remove from favorites: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="agent-dashboard">
      <h1>Agent Dashboard</h1>

      {/* Tab Navigation */}
      <div className="agent-tabs">
        <button
          className={`tab-btn ${activeTab === "properties" ? "active" : ""}`}
          onClick={() => setActiveTab("properties")}
        >
          <FontAwesomeIcon icon={faHome} /> My Properties
        </button>
        <button
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <FontAwesomeIcon icon={faCalendarAlt} /> Viewing Requests
        </button>
        <button
          className={`tab-btn ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          <FontAwesomeIcon icon={faHeart} /> My Favorites
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

      {/* Properties Tab */}
      {activeTab === "properties" && (
        <div className="properties-section">
          <div className="section-header">
            <h2>My Properties</h2>
            <div className="section-actions">
              <button
                onClick={fetchAgentProperties}
                className="refresh-btn"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faSync} spin={isLoading} /> Refresh
              </button>
              <Link to="/AddProperty" className="add-btn">
                <FontAwesomeIcon icon={faPlus} /> Add New Property
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faHome} className="empty-state-icon" />
              <p>No properties found. Add your first property!</p>
              <Link to="/AddProperty" className="add-btn">
                <FontAwesomeIcon icon={faPlus} /> Add Property
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="desktop-view">
                <table className="agent-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Location</th>
                      <th>Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id}>
                        <td className="property-image-cell">
                          <img
                            src={getImageSource(property.image_url)}
                            alt={property.title}
                            className="property-thumbnail"
                            onError={(e) => {
                              console.warn(
                                "Image failed to load:",
                                property.image_url
                              );
                              e.target.src = defaultImage;
                            }}
                          />
                        </td>
                        <td>{property.title}</td>
                        <td>£{parseFloat(property.price).toLocaleString()}</td>
                        <td>{property.location}</td>
                        <td>
                          {property.bedrooms} beds, {property.bathrooms} baths
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/property/${property.id}`}
                              className="view-btn"
                              title="View Property"
                            >
                              <FontAwesomeIcon icon={faHome} />
                            </Link>
                            {property.agent_id === userInfo.user_id && (
                              <>
                                <Link
                                  to={`/editProperty/${property.id}`}
                                  className="edit-btn"
                                  title="Edit Property"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Link>
                                <button
                                  onClick={() =>
                                    handleDeleteProperty(property.id)
                                  }
                                  className="delete-btn"
                                  title="Delete Property"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="mobile-view">
                <div className="property-cards">
                  {properties.map((property) => (
                    <div className="property-card" key={property.id}>
                      <div className="property-card-image">
                        <img
                          src={getImageSource(property.image_url)}
                          alt={property.title}
                          onError={(e) => {
                            console.warn(
                              "Image failed to load:",
                              property.image_url
                            );
                            e.target.src = defaultImage;
                          }}
                        />
                      </div>
                      <div className="property-card-content">
                        <h3>{property.title}</h3>
                        <p className="property-price">
                          £{parseFloat(property.price).toLocaleString()}
                        </p>
                        <p className="property-location">{property.location}</p>
                        <p className="property-details">
                          {property.bedrooms} beds, {property.bathrooms} baths
                        </p>
                        <div className="property-card-actions">
                          <Link
                            to={`/property/${property.id}`}
                            className="view-btn"
                            title="View Property"
                          >
                            <FontAwesomeIcon icon={faHome} /> View
                          </Link>
                          {property.agent_id === userInfo.user_id && (
                            <>
                              <Link
                                to={`/editProperty/${property.id}`}
                                className="edit-btn"
                                title="Edit Property"
                              >
                                <FontAwesomeIcon icon={faEdit} /> Edit
                              </Link>
                              <button
                                onClick={() =>
                                  handleDeleteProperty(property.id)
                                }
                                className="delete-btn"
                                title="Delete Property"
                              >
                                <FontAwesomeIcon icon={faTrash} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="bookings-section">
          <div className="section-header">
            <h2>Viewing Requests</h2>

            <div className="booking-filters">
              {/* Sorting options */}
              <div className="sort-options">
                <label>
                  <FontAwesomeIcon icon={faSort} /> Sort:
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="latest">Latest Requests</option>
                  <option value="oldest">Oldest Requests</option>
                </select>
              </div>

              {/* View mode filter */}
              <div className="view-options">
                <label>
                  <FontAwesomeIcon icon={faFilter} /> Show:
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <option value="all">All Bookings</option>
                  <option value="upcoming">Upcoming (Next 7 Days)</option>
                  <option value="later">Later Bookings</option>
                  <option value="completed">Completed Viewings</option>
                  <option value="pending">Pending Requests</option>
                  <option value="cancelled">Cancelled Bookings</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading viewing requests...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <p>No viewing requests match your current filters.</p>
          ) : (
            <div className="booking-list">
              {filteredBookings.map((booking) => {
                // Check if this is a past confirmed booking that hasn't been marked as attended
                const isPastConfirmed =
                  booking.booking_status === "confirmed" &&
                  isPastDateTime(
                    booking.scheduled_date,
                    booking.scheduled_time
                  );

                return (
                  <div key={booking.booking_id} className="booking-item">
                    <div className="booking-card">
                      <div className="booking-header">
                        <h4 className="property-title">
                          {booking.property_title}
                        </h4>
                        <span
                          className={`status-badge status-${booking.booking_status.toLowerCase()}`}
                        >
                          {booking.booking_status}
                        </span>
                      </div>

                      <div className="booking-content">
                        <div className="booking-details">
                          <div className="detail-row">
                            <FontAwesomeIcon
                              icon={faCalendarAlt}
                              className="detail-icon"
                            />
                            <div className="detail-info">
                              <span className="detail-label">
                                Viewing Date:
                              </span>
                              <span className="detail-value">
                                {new Date(
                                  booking.scheduled_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="detail-row">
                            <FontAwesomeIcon
                              icon={faClock}
                              className="detail-icon"
                            />
                            <div className="detail-info">
                              <span className="detail-label">Time:</span>
                              <span className="detail-value">
                                {booking.scheduled_time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="client-details">
                          <h5 className="client-section-title">
                            Client Details
                          </h5>
                          <div className="detail-row">
                            <FontAwesomeIcon
                              icon={faUser}
                              className="detail-icon"
                            />
                            <div className="detail-info">
                              <span className="detail-label">Name:</span>
                              <span className="detail-value">
                                {booking.user_firstName} {booking.user_lastName}
                              </span>
                            </div>
                          </div>
                          <div className="detail-row">
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="detail-icon"
                            />
                            <div className="detail-info">
                              <span className="detail-label">Email:</span>
                              <span className="detail-value">
                                {booking.user_email}
                              </span>
                            </div>
                          </div>
                          <div className="detail-row">
                            <FontAwesomeIcon
                              icon={faPhone}
                              className="detail-icon"
                            />
                            <div className="detail-info">
                              <span className="detail-label">Phone:</span>
                              <span className="detail-value">
                                {booking.user_phone || "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="booking-actions">
                        {booking.booking_status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking.booking_id,
                                  "confirmed"
                                )
                              }
                              className="action-button confirm-btn"
                            >
                              <FontAwesomeIcon icon={faCheck} /> Confirm
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking.booking_id,
                                  "cancelled"
                                )
                              }
                              className="action-button cancel-btn"
                            >
                              <FontAwesomeIcon icon={faTimes} /> Cancel
                            </button>
                          </>
                        )}

                        {/* Add attended button for confirmed past bookings */}
                        {isPastConfirmed && (
                          <button
                            onClick={() =>
                              handleUpdateBookingStatus(
                                booking.booking_id,
                                "attended"
                              )
                            }
                            className="action-button attend-btn"
                          >
                            <FontAwesomeIcon icon={faCalendarCheck} /> Mark
                            Attended
                          </button>
                        )}

                        <Link
                          to={`/property/${booking.property_id}`}
                          className="view-btn"
                          title="View Property"
                        >
                          <FontAwesomeIcon icon={faHome} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <div className="favorites-section">
          <div className="section-header">
            <h2>My Favorite Properties</h2>
            <button
              className="refresh-btn"
              onClick={fetchAgentFavorites}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faSync} spin={isLoading} /> Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faHeart} className="empty-state-icon" />
              <p>You haven't added any properties to your favorites yet.</p>
              <Link to="/properties" className="browse-btn">
                <FontAwesomeIcon icon={faSearch} /> Browse Properties
              </Link>
            </div>
          ) : (
            <div className="favorites-grid">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id || favorite.property_id}
                  className="favorite-card"
                >
                  <img
                    src={getImageSource(favorite.image_url)}
                    alt={favorite.title}
                    className="favorite-image"
                    onError={(e) => {
                      console.warn("Image failed to load:", favorite.image_url);
                      e.target.src = defaultImage;
                    }}
                  />
                  <div className="favorite-content">
                    <h3 className="favorite-title">{favorite.title}</h3>
                    <p className="favorite-price">
                      £{parseFloat(favorite.price).toLocaleString()}
                    </p>
                    <p className="favorite-location">{favorite.location}</p>
                    <div className="favorite-details">
                      <span>{favorite.bedrooms} beds</span>
                      <span>{favorite.bathrooms} baths</span>
                    </div>
                    <div className="favorite-actions">
                      <Link
                        to={`/property/${favorite.id || favorite.property_id}`}
                        className="view-btn"
                      >
                        <FontAwesomeIcon icon={faHome} /> View
                      </Link>
                      <button
                        onClick={() =>
                          handleRemoveFavorite(
                            favorite.id || favorite.property_id
                          )
                        }
                        className="delete-btn"
                      >
                        <FontAwesomeIcon icon={faTimes} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
