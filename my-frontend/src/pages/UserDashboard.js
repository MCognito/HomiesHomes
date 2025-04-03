import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCalendarAlt,
  faHeart,
  faTimes,
  faEye,
  faUserTie,
  faPaperPlane,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faSync,
  faSearch,
  faEdit,
  faTrash,
  faPlus,
  faCheck,
  faClock,
  faEnvelope,
  faPhone,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL, { API_ENDPOINTS } from "../config/api";
import "../styles/SimpleDashboard.css";

const UserDashboard = ({ token, userInfo }) => {
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentRequest, setAgentRequest] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showAgentRequestForm, setShowAgentRequestForm] = useState(false);
  const [sortOrder, setSortOrder] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [formError, setFormError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [reasonCharCount, setReasonCharCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (userInfo && token) {
        try {
          await fetchUserBookings();
          await fetchUserFavorites();

          // Only fetch agent properties if the user is an agent
          if (userInfo.user_levels >= 1) {
            await fetchAgentProperties();
          }

          // Only fetch agent request status if the user is not already an agent or admin
          if (userInfo.user_levels === 0) {
            const requestData = await fetchAgentRequestStatus();
            if (isMounted && requestData) {
              console.log("Setting agent request data:", requestData);
              setAgentRequest(requestData);
            }
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          if (isMounted) {
            setErrorMessage("Error loading dashboard data");
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [token, userInfo]);

  const fetchUserBookings = async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);
      console.log("Fetching bookings for user:", userInfo?.user_id);

      const res = await fetch(`${API_BASE_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-cache",
      });

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

  const fetchUserFavorites = async () => {
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

  const fetchAgentRequestStatus = async () => {
    try {
      console.log("Fetching agent request status");
      const response = await fetch(`${API_BASE_URL}/agent-requests/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Agent request status response:", response.status);

      // 404 is an expected response when no agent request exists
      if (response.status === 404) {
        console.log("No agent request found for this user");
        return null;
      }

      // Only throw an error for unexpected status codes
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Full agent request data:", data);
      console.log(
        "Agent request reason:",
        data.data ? data.data.request_reason : data.request_reason
      );
      return data.data || data;
    } catch (error) {
      console.error("Error fetching agent request status:", error);
      return null;
    }
  };

  const fetchAgentProperties = async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);

      if (!userInfo || !userInfo.user_id) {
        setErrorMessage("User information not available");
        return;
      }

      console.log(`Fetching properties for agent ID: ${userInfo.user_id}`);

      // Use the correct query parameter to filter by agent_id
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

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      setSuccessMessage("Booking cancelled successfully");
      // Refresh bookings after successful cancellation
      fetchUserBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setErrorMessage("Failed to cancel booking: " + error.message);
    } finally {
      setIsLoading(false);
    }
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
      fetchUserFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      setErrorMessage("Failed to remove from favorites: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAgentRequest = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setFormError("");

    try {
      // Validate that the reason only contains valid characters
      if (
        !/^[a-zA-Z0-9\s\.,\-\(\)&'\":;\@#%\!\?\/\+\*\n\r\[\]]+$/.test(
          requestReason
        )
      ) {
        setFormError(
          "Your request contains invalid characters. Please use only letters, numbers, spaces, and basic symbols."
        );
        return;
      }

      // Check minimum and maximum length
      if (requestReason.trim().length < 10) {
        setFormError(
          "Your request reason must be at least 10 characters long."
        );
        return;
      }

      if (requestReason.length > 1000) {
        setFormError("Your request reason must be less than 1000 characters.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/agent-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ request_reason: requestReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.errors) {
          if (errorData.errors.request_reason) {
            setFormError(errorData.errors.request_reason);
          } else {
            setFormError(errorData.message || "Failed to submit request");
          }
          return;
        }
        throw new Error(errorData.message || "Failed to submit agent request");
      }

      const data = await response.json();
      setSuccessMessage("Agent request submitted successfully!");
      setShowAgentRequestForm(false);
      setRequestReason("");
      setReasonCharCount(0);

      // Fetch updated status
      const updatedStatus = await fetchAgentRequestStatus();
      if (updatedStatus) {
        setAgentRequest(updatedStatus);
      }
    } catch (error) {
      console.error("Error submitting agent request:", error);
      setErrorMessage(error.message);
    } finally {
      setSubmittingRequest(false);
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

  const getImageSource = (imagePath) => {
    try {
      if (!imagePath) {
        return require("../assets/prop1.jpg");
      }

      if (imagePath.startsWith("http")) {
        return imagePath;
      }

      // If it's a local path that doesn't include "assets/"
      if (!imagePath.includes("assets/") && !imagePath.startsWith("../")) {
        return require(`../assets/${imagePath}`);
      }

      return require(`../${imagePath}`);
    } catch (error) {
      console.warn(`Image not found: ${imagePath}`, error);
      return require("../assets/prop1.jpg");
    }
  };

  const sortBookings = (bookings, order) => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date} ${a.scheduled_time}`);
      const dateB = new Date(`${b.scheduled_date} ${b.scheduled_time}`);
      return order === "recent" ? dateB - dateA : dateA - dateB;
    });
  };

  const filterBookings = (bookings, status) => {
    if (status === "all") return bookings;

    const now = new Date();

    if (status === "soon") {
      // Show bookings within the next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      return bookings.filter((booking) => {
        const bookingDate = new Date(
          booking.scheduled_date || booking.booking_date
        );
        return (
          bookingDate >= now &&
          bookingDate <= sevenDaysFromNow &&
          (booking.booking_status === "confirmed" ||
            booking.booking_status === "pending")
        );
      });
    }

    if (status === "later") {
      // Show bookings later than 7 days from now
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      return bookings.filter((booking) => {
        const bookingDate = new Date(
          booking.scheduled_date || booking.booking_date
        );
        return (
          bookingDate > sevenDaysFromNow &&
          (booking.booking_status === "confirmed" ||
            booking.booking_status === "pending")
        );
      });
    }

    // Filter by status (pending, confirmed, cancelled, attended)
    return bookings.filter(
      (booking) => booking.booking_status.toLowerCase() === status.toLowerCase()
    );
  };

  const groupBookings = (bookings, grouping) => {
    if (grouping === "none") return { "All Bookings": bookings };

    if (grouping === "status") {
      return bookings.reduce((groups, booking) => {
        const status =
          booking.booking_status.charAt(0).toUpperCase() +
          booking.booking_status.slice(1);
        if (!groups[status]) groups[status] = [];
        groups[status].push(booking);
        return groups;
      }, {});
    }

    if (grouping === "time") {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      return bookings.reduce((groups, booking) => {
        const bookingDate = new Date(
          booking.scheduled_date || booking.booking_date
        );

        if (bookingDate < now) {
          if (!groups["Past"]) groups["Past"] = [];
          groups["Past"].push(booking);
        } else if (bookingDate <= sevenDaysFromNow) {
          if (!groups["Next 7 Days"]) groups["Next 7 Days"] = [];
          groups["Next 7 Days"].push(booking);
        } else {
          if (!groups["Later"]) groups["Later"] = [];
          groups["Later"].push(booking);
        }

        return groups;
      }, {});
    }

    if (grouping === "property") {
      return bookings.reduce((groups, booking) => {
        const propertyTitle = booking.property_title || "Unknown Property";
        if (!groups[propertyTitle]) groups[propertyTitle] = [];
        groups[propertyTitle].push(booking);
        return groups;
      }, {});
    }

    return { "All Bookings": bookings };
  };

  const renderMyViewingAppointments = () => {
    // Calculate grouped and filtered bookings
    const sortedBookings = sortBookings(bookings, sortOrder);
    const filteredBookings = filterBookings(sortedBookings, filterStatus);
    const groupedBookings = groupBookings(filteredBookings, groupBy);

    // Convert grouped bookings to array format for rendering
    const groupedAndFilteredBookings = Object.entries(groupedBookings).map(
      ([name, bookings]) => ({
        name,
        bookings,
      })
    );

    return (
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Property Viewing Requests</h2>
          <button onClick={fetchUserBookings} className="refresh-btn">
            <FontAwesomeIcon icon={faSync} /> Refresh
          </button>
        </div>

        <div className="booking-controls">
          <div className="booking-filters">
            <select
              className="filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="recent">Most Recent First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="soon">Next 7 Days</option>
              <option value="later">After 7 Days</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="attended">Attended</option>
            </select>

            <select
              className="filter-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="none">No Grouping</option>
              <option value="property">Group by Property</option>
              <option value="status">Group by Status</option>
              <option value="time">Group by Time</option>
            </select>
          </div>
        </div>

        {isLoadingBookings ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your appointments...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-bookings">
            <FontAwesomeIcon
              icon={faCalendarAlt}
              className="empty-state-icon"
            />
            <p>You don't have any property viewing appointments yet.</p>
            <Link to="/properties" className="browse-properties-btn">
              <FontAwesomeIcon icon={faSearch} /> Browse Properties
            </Link>
          </div>
        ) : (
          <div className="booking-list">
            {groupedAndFilteredBookings.map((group) => (
              <div key={group.name} className="booking-group">
                {group.name !== "All Bookings" && (
                  <h3 className="group-title">{group.name}</h3>
                )}

                {group.bookings.map((booking) => (
                  <div key={booking.booking_id} className="booking-item">
                    <div className="booking-card">
                      <div className="booking-header">
                        <h4 className="property-title">
                          {booking.property_title || "Property"}
                        </h4>
                        <span
                          className={`status-badge status-${(
                            booking.booking_status || "pending"
                          ).toLowerCase()}`}
                        >
                          {booking.booking_status || "pending"}
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
                                  booking.scheduled_date || booking.booking_date
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
                                {booking.scheduled_time || booking.booking_time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {userInfo.user_levels >= 1 ? (
                          // Show client details for agents
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
                                  {booking.user_firstName}{" "}
                                  {booking.user_lastName}
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
                        ) : (
                          // Show agent details for normal users
                          <div className="agent-details">
                            <h5 className="agent-section-title">
                              Agent Details
                            </h5>
                            <div className="detail-row">
                              <FontAwesomeIcon
                                icon={faUser}
                                className="detail-icon"
                              />
                              <div className="detail-info">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">
                                  {booking.agent_firstName}{" "}
                                  {booking.agent_lastName}
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
                                  {booking.agent_email}
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
                                  {booking.agent_phone}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="booking-actions">
                        {(booking.booking_status === "PENDING" ||
                          booking.booking_status === "pending") &&
                          userInfo.user_levels >= 1 && (
                            <>
                              <button
                                onClick={() =>
                                  handleBookingStatusUpdate(
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
                                  handleBookingStatusUpdate(
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

                        {(booking.booking_status === "PENDING" ||
                          booking.booking_status === "pending") &&
                          userInfo.user_levels === 0 && (
                            <button
                              onClick={() =>
                                handleCancelBooking(booking.booking_id)
                              }
                              className="action-button cancel-btn"
                            >
                              <FontAwesomeIcon icon={faTimes} /> Cancel
                            </button>
                          )}

                        {(booking.booking_status === "CONFIRMED" ||
                          booking.booking_status === "confirmed") &&
                          userInfo.user_levels >= 1 && (
                            <>
                              <button
                                onClick={() =>
                                  handleBookingStatusUpdate(
                                    booking.booking_id,
                                    "attended"
                                  )
                                }
                                className="action-button attend-btn"
                              >
                                <FontAwesomeIcon icon={faCheck} /> Mark as
                                Attended
                              </button>
                              <button
                                onClick={() =>
                                  handleBookingStatusUpdate(
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

                        {(booking.booking_status === "CONFIRMED" ||
                          booking.booking_status === "confirmed") &&
                          userInfo.user_levels === 0 && (
                            <button
                              onClick={() =>
                                handleCancelBooking(booking.booking_id)
                              }
                              className="action-button cancel-btn"
                            >
                              <FontAwesomeIcon icon={faTimes} /> Cancel
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      // Refresh bookings after status update
      fetchUserBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      setErrorMessage("Error updating booking status: " + error.message);
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${
            activeTab === "bookings" ? "active" : ""
          }`}
          onClick={() => setActiveTab("bookings")}
        >
          <FontAwesomeIcon icon={faCalendarAlt} /> My Bookings
        </button>
        <button
          className={`dashboard-tab ${
            activeTab === "favorites" ? "active" : ""
          }`}
          onClick={() => setActiveTab("favorites")}
        >
          <FontAwesomeIcon icon={faHeart} /> My Favorites
        </button>
        {/* Show My Properties tab only for agents */}
        {userInfo && userInfo.user_levels >= 1 && (
          <button
            className={`dashboard-tab ${
              activeTab === "properties" ? "active" : ""
            }`}
            onClick={() => setActiveTab("properties")}
          >
            <FontAwesomeIcon icon={faHome} /> My Properties
          </button>
        )}
        {userInfo && userInfo.user_levels === 0 && (
          <button
            className={`dashboard-tab ${
              activeTab === "agent-request" ? "active" : ""
            }`}
            onClick={() => setActiveTab("agent-request")}
          >
            <FontAwesomeIcon icon={faUserTie} /> Become an Agent
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="alert-error">
          {errorMessage}
          <button onClick={() => setErrorMessage("")}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert-success">
          {successMessage}
          <button onClick={() => setSuccessMessage("")}>×</button>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && <div>{renderMyViewingAppointments()}</div>}

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <div>
          <div className="section-header">
            <h2 className="section-title">My Favorite Properties</h2>
            <button
              className="refresh-button"
              onClick={fetchUserFavorites}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faHeart} /> Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : favorites.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faHeart} className="empty-state-icon" />
              <p>You haven't added any properties to your favorites yet.</p>
              <Link to="/properties" className="browse-button">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="favorites-grid">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id || favorite.property_id}
                  className="property-card"
                >
                  <img
                    src={getImageSource(favorite.image_url)}
                    alt={favorite.title}
                    className="property-image"
                  />
                  <div className="property-content">
                    <h3 className="property-title">{favorite.title}</h3>
                    <p className="property-price">
                      £{parseFloat(favorite.price).toLocaleString()}
                    </p>
                    <p className="property-location">{favorite.location}</p>
                    <div className="property-details">
                      <span>{favorite.bedrooms} beds</span>
                      <span>{favorite.bathrooms} baths</span>
                    </div>
                    <div className="property-actions">
                      <Link
                        to={`/property/${favorite.id || favorite.property_id}`}
                        className="action-btn view"
                      >
                        <FontAwesomeIcon icon={faEye} /> View
                      </Link>
                      <button
                        onClick={() =>
                          handleRemoveFavorite(
                            favorite.id || favorite.property_id
                          )
                        }
                        className="action-btn delete"
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

      {/* Properties Tab (Only for Agents) */}
      {activeTab === "properties" && userInfo && userInfo.user_levels >= 1 && (
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
            <div className="property-cards">
              {properties.map((property) => (
                <div className="property-card" key={property.id}>
                  <div className="property-card-image">
                    <img
                      src={
                        property.image_url
                          ? getImageSource(property.image_url)
                          : getImageSource(null)
                      }
                      alt={property.title}
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
                        <FontAwesomeIcon icon={faEye} /> View
                      </Link>
                      <Link
                        to={`/editProperty/${property.id}`}
                        className="edit-btn"
                        title="Edit Property"
                      >
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="delete-btn"
                        title="Delete Property"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agent Request Tab */}
      {activeTab === "agent-request" && (
        <div>
          <h2 className="section-title">Become a Property Agent</h2>

          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : agentRequest ? (
            <div className="agent-request-status">
              <div className="request-status">
                <span className={`status status-${agentRequest.status}`}>
                  Status:{" "}
                  {agentRequest.status.charAt(0).toUpperCase() +
                    agentRequest.status.slice(1)}
                </span>
              </div>

              <div className="request-details">
                <div className="request-info">
                  <h3>Your Request Details</h3>
                  <p className="request-date">
                    <strong>Submitted on:</strong>{" "}
                    {new Date(agentRequest.request_date).toLocaleDateString()}
                  </p>
                  <div className="request-reason">
                    <h4>Your reason:</h4>
                    <div className="reason-content">
                      {agentRequest.request_reason ||
                        agentRequest.reason ||
                        "No reason provided"}
                    </div>
                  </div>
                </div>

                {agentRequest.response && (
                  <div className="admin-response">
                    <h3>Admin Response</h3>
                    <p>{agentRequest.response}</p>
                    <p className="response-date">
                      <small>
                        Responded on:{" "}
                        {new Date(
                          agentRequest.response_date
                        ).toLocaleDateString()}
                      </small>
                    </p>
                  </div>
                )}
              </div>

              {agentRequest.status === "rejected" && (
                <div className="request-actions">
                  <button
                    className="browse-button"
                    onClick={() => {
                      setAgentRequest(null);
                      setShowAgentRequestForm(true);
                      setRequestReason("");
                      setReasonCharCount(0);
                      setFormError("");
                    }}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} /> Submit New Request
                  </button>
                </div>
              )}
            </div>
          ) : showAgentRequestForm ? (
            <form
              className="form-container"
              onSubmit={handleSubmitAgentRequest}
            >
              <div className="form-group">
                <label>Why do you want to become an agent?</label>
                <textarea
                  value={requestReason}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRequestReason(value);
                    setReasonCharCount(value.length);

                    // Clear any existing error when user types
                    if (formError) {
                      setFormError("");
                    }
                  }}
                  placeholder="Please explain why you would like to become an agent and any relevant experience you have."
                  className={formError ? "error-input" : ""}
                  maxLength={1000}
                  required
                ></textarea>
                {formError && <span className="field-error">{formError}</span>}
                <div className="char-counter">
                  <span
                    className={
                      reasonCharCount > 950 ? "char-limit-warning" : ""
                    }
                  >
                    {reasonCharCount}/1000 characters
                  </span>
                  <small className="allowed-chars-info">
                    Allowed: letters, numbers, spaces, and basic symbols
                    (@#%&.,-'":!?)
                  </small>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="browse-button"
                  disabled={submittingRequest}
                >
                  {submittingRequest ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAgentRequestForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="agent-request-info">
              <p>As an agent, you'll be able to:</p>
              <ul>
                <li>List and manage your own properties</li>
                <li>Schedule and manage property viewings</li>
                <li>Communicate directly with potential buyers</li>
              </ul>
              <button
                className="browse-button"
                onClick={() => setShowAgentRequestForm(true)}
              >
                <FontAwesomeIcon icon={faUserTie} /> Apply Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
