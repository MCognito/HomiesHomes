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
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

const AgentDashboard = ({ token, userInfo }) => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("properties");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    if (activeTab === "properties") {
      fetchAgentProperties();
    } else if (activeTab === "bookings") {
      fetchAgentBookings();
    }
  }, [activeTab, token, sortOption]);

  const fetchAgentProperties = async () => {
    try {
      setErrorMessage("");

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
    }
  };

  const fetchAgentBookings = async () => {
    try {
      setErrorMessage("");
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
            <Link to="/AddProperty" className="add-btn">
              <FontAwesomeIcon icon={faPlus} /> Add New Property
            </Link>
          </div>

          {properties.length === 0 ? (
            <p>No properties found. Add your first property!</p>
          ) : (
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
                        src={
                          property.image_url
                            ? require(`../assets/${property.image_url}`)
                            : require("../assets/prop1.jpg")
                        }
                        alt={property.title}
                        className="property-thumbnail"
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

          {filteredBookings.length === 0 ? (
            <p>No viewing requests match your current filters.</p>
          ) : (
            <table className="agent-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  // Check if this is a past confirmed booking that hasn't been marked as attended
                  const isPastConfirmed =
                    booking.booking_status === "confirmed" &&
                    isPastDateTime(
                      booking.scheduled_date,
                      booking.scheduled_time
                    );

                  // Determine if this is a past date for visual highlighting
                  const isDateInPast = isPastDate(booking.scheduled_date);

                  return (
                    <tr
                      key={booking.booking_id}
                      className={`status-row-${booking.booking_status} ${
                        isPastConfirmed ? "past-booking" : ""
                      }`}
                    >
                      <td>{booking.property_title}</td>
                      <td>
                        <FontAwesomeIcon icon={faUsers} />{" "}
                        {booking.user_firstName} {booking.user_lastName}
                        <div className="client-details">
                          <small>{booking.user_email}</small>
                          {booking.user_phone && (
                            <small>{booking.user_phone}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        {new Date(booking.scheduled_date).toLocaleDateString()}
                        {isPastConfirmed && (
                          <span className="date-indicator past-date">Past</span>
                        )}
                        {isUpcoming(booking.scheduled_date) &&
                          !isPastDateTime(
                            booking.scheduled_date,
                            booking.scheduled_time
                          ) && (
                            <span className="date-indicator upcoming-date">
                              Soon
                            </span>
                          )}
                      </td>
                      <td>
                        {booking.scheduled_time}
                        {isPastConfirmed && (
                          <div className="time-indicator">
                            <small className="past-time">Completed</small>
                          </div>
                        )}
                      </td>
                      <td className={`status-${booking.booking_status}`}>
                        {booking.booking_status.charAt(0).toUpperCase() +
                          booking.booking_status.slice(1)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {booking.booking_status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.booking_id,
                                    "confirmed"
                                  )
                                }
                                className="confirm-btn"
                                title="Confirm Booking"
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
                                className="cancel-btn"
                                title="Cancel Booking"
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
                              className="attended-btn"
                              title="Mark as Attended"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
