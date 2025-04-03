import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { hasLink, enhanceResourceWithLinks } from "../services/hateoas";
import API_BASE_URL from "../config/api";

// Import all property images for dynamic loading
import prop1 from "../assets/prop1.jpg";

// Create an image map for easier access
const imageMap = {
  "prop1.jpg": prop1,
};

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
  const navigate = useNavigate();

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

        const options = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          credentials: "include",
          cache: "no-store", // Force browser to bypass cache
        };

        // Standard fetch 
        const response = await fetch(
          `${API_BASE_URL}/properties/${id}`,
          options
        );

        if (!response.ok) {
          throw new Error(`Error fetching property: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.data) {
          console.error("Property data not found in response:", data);
          throw new Error("Property data structure is invalid");
        }

        // Check for role-based headers
        const agentAccess = response.headers.get("X-Agent-Access") === "true";
        const adminAccess = response.headers.get("X-Admin-Access") === "true";

        setHasAgentAccess(agentAccess);
        setHasAdminAccess(adminAccess);

        // Extract and enhance the property with full links
        const enhancedProperty = enhanceResourceWithLinks(data.data);

        // Additional validation to ensure property data is complete
        if (!enhancedProperty || !enhancedProperty.title) {
          throw new Error("Property data is incomplete");
        }

        setProperty(enhancedProperty);

        // Log data source
        console.log(`Property data was fetched from server`);

        // Store HATEOAS links from response
        setLinks(data._links || {});

        // Set a flag that we viewed this property - will trigger refresh when going to properties page
        localStorage.setItem("propertyViewed", "true");
        localStorage.setItem("lastViewedProperty", id);
        localStorage.setItem("viewTimestamp", Date.now().toString());
        console.log(
          "[DEBUG] PropertyDetails: Set propertyViewed flag for the Properties page"
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property details");
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, token]);

  // Add useEffect to call fetchFavorites
  useEffect(() => {
    if (token && id) {
      fetchFavorites();
    }
  }, [token, id]);

  const fetchFavorites = async () => {
    if (!token) return;

    try {
      console.log("[DEBUG] PropertyDetails: Fetching favorites");

      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store",
      };

      const response = await fetch(`${API_BASE_URL}/favourites`, options);

      if (!response.ok) {
        console.error("Error fetching favorites:", response.status);
        return;
      }

      const data = await response.json();

      if (data && data.data) {
        console.log(
          `[DEBUG] PropertyDetails: Loaded ${data.data.length} favorites`
        );

        // Check if the current property is in the favorites
        const favoriteIds = data.data.map((fav) =>
          parseInt(fav.property_id || fav.id, 10)
        );

        const propertyIdNum = parseInt(id, 10);
        setIsFavourited(favoriteIds.includes(propertyIdNum));
        console.log(
          `[DEBUG] PropertyDetails: Property ${id} is ${
            favoriteIds.includes(propertyIdNum) ? "" : "not "
          }in favorites`
        );
      }
    } catch (err) {
      console.error("[DEBUG] PropertyDetails: Favorites fetch error:", err);
    }
  };

  const toggleFavourite = async () => {
    if (!token) {
      alert("Please log in to favorite properties");
      return;
    }

    try {
      const method = isFavourited ? "DELETE" : "POST";
      const endpoint = isFavourited
        ? `${API_BASE_URL}/favourites/${id}`
        : `${API_BASE_URL}/favourites`;

      console.log(`[DEBUG] PropertyDetails: ${method} request to ${endpoint}`);

      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      };

      // Add body for POST requests
      if (method === "POST") {
        options.body = JSON.stringify({ property_id: parseInt(id, 10) });
      }

      const response = await fetch(endpoint, options);

      if (response.ok) {
        // Toggle the favorite state
        setIsFavourited(!isFavourited);
        console.log(
          `[DEBUG] PropertyDetails: Successfully ${
            isFavourited ? "removed from" : "added to"
          } favorites`
        );

        // Refetch favorites to ensure state is correct
        setTimeout(fetchFavorites, 100);
      } else {
        console.error(`Failed to toggle favorite: ${response.status}`);
      }
    } catch (err) {
      console.error("Error toggling favourite:", err);
    }
  };

  const isFutureDate = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDate = new Date(dateString);
    return selectedDate >= today;
  };

  const isValidTimeRange = (timeString) => {
    // Check if time is between 9am and 5pm (business hours)
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
    const now = new Date();
    const businessStart = 9; // 9 AM
    const businessEnd = 17; // 5 PM

    // Date validation
    if (!date) {
      errors.date = "Please select a date";
    } else if (!isFutureDate(date)) {
      errors.date = "Booking must be for today or a future date";
    }

    // Time validation
    if (!time) {
      errors.time = "Please select a time";
    } else {
      const [hours, minutes] = time.split(":").map((num) => parseInt(num, 10));

      // Check business hours
      if (
        hours < businessStart ||
        (hours === businessEnd && minutes > 0) ||
        hours > businessEnd
      ) {
        errors.time = `Booking time must be during business hours (${businessStart}:00 AM to ${businessEnd}:00 PM)`;
      }

      // Check if time has already passed for same-day bookings
      if (date && isToday(date)) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (
          hours < currentHour ||
          (hours === currentHour && minutes <= currentMinute)
        ) {
          errors.time = "You cannot book a time that has already passed";
        }
      }
    }

    // Check combined date and time
    if (date && time && !isFutureDateTime(date, time)) {
      errors.time = "The selected date and time must be in the future";
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
      setMessage("Incorrect format fields");
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
      !window.confirm("Are you sure you want to delete this property?")
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

  // New function to handle HATEOAS link actions
  const handleLinkAction = (action) => {
    console.log("Following HATEOAS link:", action);

    // Handle based on method
    switch (action.method) {
      case "DELETE":
        if (window.confirm("Are you sure you want to delete this property?")) {
          handleDelete();
        }
        break;
      case "PUT":
        navigate(`/editProperty/${id}`);
        break;
      case "GET":
        // GET links are handled automatically by the Link component
        break;
      default:
        console.log("Unhandled link action:", action);
    }
  };

  if (loading)
    return <p className="loading-message">Loading property details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!property) return <p className="no-results">Property not found</p>;

  // Extract values with fallbacks to prevent UI errors
  const title = property.title || "Unnamed Property";
  const location = property.location || "Location unavailable";
  const description = property.description || "No description available";
  const price = property.price ? parseFloat(property.price) : 0;
  const bedrooms = property.bedrooms || 0;
  const bathrooms = property.bathrooms || 0;
  const propertyType = property.property_type || "Not specified";
  const imageUrl = property.image_url;

  // Handle agent data safely
  const agent = property.agent || {};
  const agentName =
    agent.firstName && agent.lastName
      ? `${agent.firstName} ${agent.lastName}`
      : agent.username || "Unknown";
  const agentEmail = agent.email || "No email provided";
  const agentPhone = agent.phone || "Not provided";

  return (
    <div className="property-details-page">
      <img
        src={getImageSource(imageUrl)}
        alt={title}
        className="property-full-img"
        onError={(e) => {
          console.warn("Image failed to load:", imageUrl);
          e.target.src = defaultImage; // Fallback to default image
        }}
      />

      <div className="property-info-container">
        <div className="property-header-with-fav">
          <h2 className="property-details-title">{title}</h2>
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
        <p className="property-price">£{price.toLocaleString()}</p>
        <p className="property-description">{description}</p>

        <div className="property-metrics">
          <div className="metric-card">
            <FontAwesomeIcon icon={faBed} /> {bedrooms} Bedrooms
          </div>
          <div className="metric-card">
            <FontAwesomeIcon icon={faBath} /> {bathrooms} Bathrooms
          </div>
          <div className="metric-card">
            <FontAwesomeIcon icon={faHome} /> {propertyType}
          </div>
        </div>

        {/* Agent Information Section */}
        {property.agent && (
          <div className="agent-info-section">
            <h3>Contact Agent</h3>
            <div className="agent-details">
              <p className="agent-name">{agentName}</p>
              <p className="agent-email">
                <strong>Email:</strong> {agentEmail}
              </p>
              <p className="agent-phone">
                <strong>Phone:</strong> {agentPhone}
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

          {hasLink(links, "update") &&
            userInfo &&
            (userInfo.user_id === property.agent_id ||
              userInfo.user_levels === 2) && (
              <Link to={`/editProperty/${property.id}`} className="edit-btn">
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Link>
            )}

          {hasLink(links, "delete") &&
            userInfo &&
            (userInfo.user_id === property.agent_id ||
              userInfo.user_levels === 2) && (
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
                <div className="error-text">
                  <span className="error-icon">⚠️</span> {validationErrors.date}
                </div>
              )}
              <span className="helper-text">
                Select any date from today onwards
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="booking-time">Select Time:</label>
              <input
                id="booking-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={isToday(date) ? getCurrentTimeString() : "09:00"}
                max="17:00"
                className={validationErrors.time ? "input-error" : ""}
                required
              />
              {validationErrors.time && (
                <div className="error-text">
                  <span className="error-icon">⚠️</span> {validationErrors.time}
                </div>
              )}
              <span className="helper-text">
                Business hours: 9:00 AM - 5:00 PM
                {isToday(date) ? ", only future times available today" : ""}
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
              <div className={`booking-message ${messageType}`}>
                {messageType === "error" && (
                  <span className="error-icon">⚠️</span>
                )}
                {messageType === "success" && (
                  <span className="success-icon">✅</span>
                )}
                {messageType === "info" && (
                  <span className="info-icon">ℹ️</span>
                )}
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
