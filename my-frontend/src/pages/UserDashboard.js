import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCalendarAlt,
  faHeart,
  faTimes,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

const UserDashboard = ({ token, userInfo }) => {
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchUserBookings();
    } else if (activeTab === "favorites") {
      fetchUserFavorites();
    }
  }, [activeTab, token]);

  const fetchUserBookings = async () => {
    try {
      setErrorMessage("");
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
    }
  };

  const fetchUserFavorites = async () => {
    try {
      setErrorMessage("");
      const res = await fetch(`${API_BASE_URL}/favourites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-cache",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch favorites (${res.status})`);
      }

      const data = await res.json();
      console.log("Fetched favorites:", data);
      setFavorites(data.data || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setErrorMessage("Error fetching favorites: " + err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
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

      console.log(`Cancelling booking ${sanitizedBookingId}`);

      // Validate that we're only trying to cancel (not other status changes)
      const status = "cancelled";

      // Send the cancellation request
      const res = await fetch(
        `${API_BASE_URL}/bookings/${sanitizedBookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      // Check for network or server errors
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to cancel booking (${res.status}): ${
            errorData.error || "Unknown error"
          }`
        );
      }

      // Parse response data
      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Booking cancelled successfully");
        // Refresh the bookings list after a short delay
        setTimeout(fetchUserBookings, 500);
      } else {
        throw new Error(data.error || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setErrorMessage("Error cancelling booking: " + err.message);
    }
  };

  const handleRemoveFavorite = async (propertyId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this property from favorites?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/favourites/${propertyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to remove from favorites (${res.status})`);
      }

      setSuccessMessage("Property removed from favorites");
      fetchUserFavorites(); // Refresh the favorites list
    } catch (err) {
      console.error("Error removing favorite:", err);
      setErrorMessage("Error removing favorite: " + err.message);
    }
  };

  // Helper function to get image source
  const getImageSource = (imagePath) => {
    if (!imagePath) return require("../assets/prop1.jpg");

    try {
      return require(`../assets/${imagePath}`);
    } catch (error) {
      console.warn(`Image not found: ${imagePath}`, error);
      return require("../assets/prop1.jpg");
    }
  };

  return (
    <div className="user-dashboard">
      <h1>User Dashboard</h1>

      {/* Tab Navigation */}
      <div className="user-tabs">
        <button
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <FontAwesomeIcon icon={faCalendarAlt} /> My Bookings
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

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div className="bookings-section">
          <h2>My Viewing Appointments</h2>

          {bookings.length === 0 ? (
            <p>
              You have no viewing appointments. Browse properties to schedule a
              viewing!
            </p>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Agent</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.booking_id}
                    className={`status-row-${booking.booking_status}`}
                  >
                    <td>{booking.property_title}</td>
                    <td>{booking.agent_name}</td>
                    <td>
                      {new Date(booking.scheduled_date).toLocaleDateString()}
                    </td>
                    <td>{booking.scheduled_time}</td>
                    <td className={`status-${booking.booking_status}`}>
                      {booking.booking_status.charAt(0).toUpperCase() +
                        booking.booking_status.slice(1)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/property/${booking.property_id}`}
                          className="view-btn"
                          title="View Property"
                        >
                          <FontAwesomeIcon icon={faHome} />
                        </Link>
                        {booking.booking_status === "pending" && (
                          <button
                            onClick={() =>
                              handleCancelBooking(booking.booking_id)
                            }
                            className="cancel-btn"
                            title="Cancel Booking"
                          >
                            <FontAwesomeIcon icon={faTimes} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <div className="favorites-section">
          <h2>My Favorite Properties</h2>

          {favorites.length === 0 ? (
            <p>You haven't added any properties to your favorites yet.</p>
          ) : (
            <div className="favorites-grid">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id || favorite.property_id}
                  className="favorite-card"
                >
                  <div className="favorite-image">
                    <img
                      src={getImageSource(favorite.image_url)}
                      alt={favorite.title}
                    />
                    <button
                      onClick={() =>
                        handleRemoveFavorite(
                          favorite.id || favorite.property_id
                        )
                      }
                      className="remove-favorite-btn"
                      title="Remove from Favorites"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="favorite-details">
                    <h3>{favorite.title}</h3>
                    <p className="favorite-price">
                      £{parseFloat(favorite.price).toLocaleString()}
                    </p>
                    <p className="favorite-location">{favorite.location}</p>
                    <p className="favorite-specs">
                      {favorite.bedrooms} beds, {favorite.bathrooms} baths
                    </p>
                    <div className="favorite-actions">
                      <Link
                        to={`/property/${favorite.id || favorite.property_id}`}
                        className="view-property-btn"
                      >
                        <FontAwesomeIcon icon={faEye} /> View Details
                      </Link>
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

export default UserDashboard;
