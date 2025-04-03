import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faBath,
  faHome,
  faEdit,
  faTrash,
  faHeart as faSolidHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import defaultImage from "../assets/prop1.jpg";

// Import all property images for dynamic loading
import prop1 from "../assets/prop1.jpg";

// Create an image map for easier access
const imageMap = {
  "prop1.jpg": prop1,
};

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

const PropertyDetails = ({ token, userInfo }) => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [links, setLinks] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [hasAgentAccess, setHasAgentAccess] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isFavourited, setIsFavourited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get the image source
  const getImageSource = (imageName) => {
    if (!imageName) return defaultImage;

    // If the image name is in our map, use it
    if (imageMap[imageName]) {
      return imageMap[imageName];
    }

    // Otherwise try to construct a path (fallback to default if it fails)
    try {
      return require(`../assets/${imageName}`);
    } catch (error) {
      console.warn(`Image not found: ${imageName}`, error);
      return defaultImage;
    }
  };

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching property details for ID: ${id}`);
        const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          credentials: "include",
          cache: "default",
        });

        if (!res.ok) {
          throw new Error(`Error fetching property: ${res.status}`);
        }

        // Check for role-based headers
        const agentAccess = res.headers.get("X-Agent-Access") === "true";
        const adminAccess = res.headers.get("X-Admin-Access") === "true";

        setHasAgentAccess(agentAccess);
        setHasAdminAccess(adminAccess);

        const data = await res.json();
        setProperty(data.data || null);

        // Store HATEOAS links if present
        if (data._links) {
          setLinks(data._links);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details");
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, token]);

  useEffect(() => {
    const checkFavourite = async () => {
      if (!token || !id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/favourites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          cache: "default",
        });

        if (res.ok) {
          const data = await res.json();
          const favIds = data.data
            ? data.data.map((p) => p.property_id || p.id)
            : [];
          setIsFavourited(favIds.includes(Number(id)));
        }
      } catch (err) {
        console.error("Failed to check favourites:", err);
      }
    };

    checkFavourite();
  }, [id, token]);

  const toggleFavourite = async () => {
    if (!token) {
      alert("Please log in to add favorites");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/favourites${isFavourited ? `/${id}` : ""}`,
        {
          method: isFavourited ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: isFavourited ? undefined : JSON.stringify({ property_id: id }),
        }
      );

      if (res.ok) {
        setIsFavourited(!isFavourited);
      } else {
        console.error(`Failed to toggle favorite: ${res.status}`);
      }
    } catch (err) {
      console.error("Favourite toggle failed:", err);
    }
  };

  const isFutureDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDate = new Date(dateString);
    return selectedDate >= today;
  };

  const isValidTimeRange = (timeString) => {
    // Check if time is between 9am and 7pm (business hours)
    const hour = parseInt(timeString.split(":")[0], 10);
    return hour >= 9 && hour < 19;
  };

  const isFutureDateTime = (dateString, timeString) => {
    const now = new Date();
    const [hours, minutes] = timeString
      .split(":")
      .map((num) => parseInt(num, 10));
    const selectedDateTime = new Date(dateString);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    return selectedDateTime > now;
  };

  const validateBookingInputs = () => {
    const errors = {};

    if (!date) {
      errors.date = "Please select a date";
    } else if (!isFutureDate(date)) {
      errors.date = "Viewing date must be today or in the future";
    }

    if (!time) {
      errors.time = "Please select a time";
    } else if (!isValidTimeRange(time)) {
      errors.time = "Viewing time must be between 9:00 AM and 7:00 PM";
    }

    if (date && time && !isFutureDateTime(date, time)) {
      errors.time = "You cannot book a time that has already passed";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBooking = async () => {
    if (!token) {
      setMessageType("error");
      setMessage("Please log in to book a viewing");
      return;
    }

    // Validate inputs
    if (!validateBookingInputs()) {
      setMessageType("error");
      return;
    }

    try {
      setMessageType("info");
      setMessage("Sending booking request...");
      console.log("Submitting booking request for property ID:", id);

      // Sanitize inputs before sending
      const sanitizedDate = date.trim();
      const sanitizedTime = time.trim();

      // Make sure property_id is properly handled
      const propertyId = parseInt(id, 10);

      if (isNaN(propertyId) || propertyId <= 0) {
        throw new Error("Invalid property ID");
      }

      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          property_id: propertyId,
          scheduled_date: sanitizedDate,
          scheduled_time: sanitizedTime,
        }),
      });

      const data = await res.json();
      console.log("Booking response:", data);

      if (res.ok && data.success) {
        setMessageType("success");
        setMessage(
          "✅ Booking request sent! The agent will review your request."
        );
        setTimeout(() => {
          setShowModal(false);
          setMessage("");
          setDate("");
          setTime("");
          setValidationErrors({});
        }, 2000);
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to book viewing. Please try again.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setMessageType("error");
      setMessage("Server error. Please try again later.");
    }
  };

  const handleDelete = async () => {
    if (
      !links.delete ||
      !confirm("Are you sure you want to delete this property?")
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${links.delete.href}`, {
        method: links.delete.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (res.ok) {
        window.location.href = "/properties";
      } else {
        const error = await res.json();
        console.error("Failed to delete property:", error);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Function to get current time in HH:MM format for min attribute
  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Function to determine if selected date is today
  const isToday = (dateString) => {
    const today = new Date();
    const selectedDate = new Date(dateString);
    return (
      today.getDate() === selectedDate.getDate() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getFullYear() === selectedDate.getFullYear()
    );
  };

  if (loading)
    return <p className="loading-message">Loading property details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!property) return <p className="no-results">Property not found</p>;

  return (
    <div className="property-details-page">
      <img
        src={getImageSource(property.image_url)}
        alt={property.title}
        className="property-full-img"
      />

      <div className="property-info-container">
        <div className="property-header-with-fav">
          <h2 className="property-details-title">{property.title}</h2>
          {token && (
            <div className="favourite-container">
              <FontAwesomeIcon
                icon={isFavourited ? faSolidHeart : faRegularHeart}
                className={`heart-icon-large ${
                  isFavourited ? "favourited" : ""
                }`}
                onClick={toggleFavourite}
              />
            </div>
          )}
        </div>
        <p className="property-price">
          £{parseFloat(property.price).toLocaleString()}
        </p>
        <p className="property-description">{property.description}</p>

        <div className="property-metrics">
          <div className="metric-card">
            <FontAwesomeIcon icon={faBed} /> {property.bedrooms} Bedrooms
          </div>
          <div className="metric-card">
            <FontAwesomeIcon icon={faBath} /> {property.bathrooms} Bathrooms
          </div>
          <div className="metric-card">
            <FontAwesomeIcon icon={faHome} /> {property.property_type}
          </div>
        </div>

        {/* Agent Information Section */}
        {property.agent && (
          <div className="agent-info-section">
            <h3>Contact Agent</h3>
            <div className="agent-details">
              <p className="agent-name">
                {property.agent.firstName} {property.agent.lastName}
              </p>
              <p className="agent-email">
                <strong>Email:</strong> {property.agent.email}
              </p>
              <p className="agent-phone">
                <strong>Phone:</strong> {property.agent.phone || "Not provided"}
              </p>
            </div>
          </div>
        )}

        <div className="property-actions">
          {userInfo && (
            <button className="book-btn" onClick={() => setShowModal(true)}>
              Book Viewing
            </button>
          )}

          {links.update && (
            <Link to={`/editProperty/${property.id}`} className="edit-btn">
              <FontAwesomeIcon icon={faEdit} /> Edit
            </Link>
          )}

          {links.delete && (
            <button className="delete-btn" onClick={handleDelete}>
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
          )}
        </div>

        {/* Display the role-based capabilities */}
        {hasAgentAccess && (
          <div className="role-indicator agent">
            <span>Agent Access</span>
          </div>
        )}

        {hasAdminAccess && (
          <div className="role-indicator admin">
            <span>Admin Access</span>
          </div>
        )}
      </div>

      {showModal && (
        <div className="booking-modal">
          <div className="booking-form">
            <h3>Book Viewing</h3>
            <p>
              {userInfo?.user_firstName} {userInfo?.user_lastName}
              <br />
              {userInfo?.user_email} | {userInfo?.user_phone}
            </p>

            <div className="form-group">
              <label htmlFor="booking-date">Select Date:</label>
              <input
                id="booking-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={validationErrors.date ? "input-error" : ""}
                required
              />
              {validationErrors.date && (
                <span className="error-text">{validationErrors.date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="booking-time">Select Time:</label>
              <input
                id="booking-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={isToday(date) ? getCurrentTimeString() : "09:00"}
                max="19:00"
                className={validationErrors.time ? "input-error" : ""}
                required
              />
              {validationErrors.time && (
                <span className="error-text">{validationErrors.time}</span>
              )}
              <span className="helper-text">
                Business hours: 9:00 AM - 7:00 PM
                {isToday(date) ? ", only future times available" : ""}
              </span>
            </div>

            <div className="booking-actions">
              <button
                className="confirm-btn"
                onClick={handleBooking}
                disabled={messageType === "info"}
              >
                Confirm Booking
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                  setMessageType("");
                  setValidationErrors({});
                  setDate("");
                  setTime("");
                }}
              >
                Cancel
              </button>
            </div>

            {message && (
              <p className={`booking-message ${messageType}`}>{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
