import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faBath,
  faHome,
  faCalendarAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import "../components/PropertyDetails.css";
import API_BASE_URL from "../config/api";

// Import default image and all property images
import defaultImage from "../assets/prop1.jpg";
import prop1 from "../assets/prop1.jpg";
import prop2 from "../assets/prop2.jpg";

// Create an image map for easier access
const imageMap = {
  "prop1.jpg": prop1,
  "prop2.jpg": prop2,
};

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
    console.log("Found image in map:", imagePath);
    return imageMap[imagePath];
  }

  // Check if it's one of the default images by name
  if (imagePath === "prop1.jpg") return prop1;
  if (imagePath === "prop2.jpg") return prop2;

  // For images stored on the backend server
  const serverPath = `${API_BASE_URL}/images/${imagePath}`;

  // Log the paths we're trying
  console.log("Trying image paths:", {
    imagePath,
    serverPath,
    importedImages: Object.keys(imageMap),
  });

  // Return the server path as best guess
  return serverPath;
};

// Booking constraints from backend/schemas/booking-schema.json
// These should match the constraints defined in the backend schema
const BOOKING_CONSTRAINTS = {
  // Time must be during business hours (09:00-17:00) per schema
  MIN_TIME: "09:00",
  MAX_TIME: "17:00",
  // Date must be today or in the future per schema
  DATE_FORMAT: "YYYY-MM-DD",
  // Valid booking statuses per schema
  STATUSES: ["pending", "confirmed", "cancelled", "attended"],
  // Default status per schema
  DEFAULT_STATUS: "pending",
};

/**
 * Property detail page that fetches and displays a single property
 * Shows a property with all its details and allows users to book viewings
 */
const PropertyDetails = ({ token, userInfo }) => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  // Get today's date in format YYYY-MM-DD for the date input min attribute
  const today = new Date().toISOString().split("T")[0];
  // Define business hours (9AM to 5PM) for time input validation
  const minTime = BOOKING_CONSTRAINTS.MIN_TIME;
  const maxTime = BOOKING_CONSTRAINTS.MAX_TIME;

  // Fetch property data when component mounts or ID changes
  useEffect(() => {
    const fetchPropertyData = async () => {
      setLoading(true);
      try {
        console.log(`Fetching property with id: ${id} from API`);
        // Get the properties from central state first if available
        // Otherwise fetch from API
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        console.log(`API Response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(
            `Server responded with status: ${response.status} ${response.statusText}`
          );
        }

        // Now we can safely parse the response body since we've verified that the request was successful
        const data = await response.json();
        console.log("Property data received:", data);

        if (data && data.data) {
          setProperty(data.data);
        } else {
          throw new Error("Invalid property data structure");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Unable to load property details. Please try again later.");
        setLoading(false);
      }
    };

    if (id) {
      fetchPropertyData();
    }
  }, [id, token]);

  // Send booking request to the API
  const handleBooking = async () => {
    try {
      // Make sure we have required fields
      if (!date || !time) {
        alert("Please select both date and time for your viewing");
        return;
      }

      // Validate that the selected date is not in the past
      // This implements the schema requirement: "Must be today or a future date."
      const selectedDate = new Date(date);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (selectedDate < currentDate) {
        alert(
          "Cannot book a viewing for a date in the past. Please select a future date."
        );
        return;
      }

      // Validate that the selected time is during business hours (9AM to 5PM)
      // This implements the schema requirement: "Must be during business hours (09:00-17:00)."
      const hourMinute = time.split(":");
      const hour = parseInt(hourMinute[0], 10);
      const minute = parseInt(hourMinute[1], 10);

      const minHour = parseInt(BOOKING_CONSTRAINTS.MIN_TIME.split(":")[0], 10);
      const maxHour = parseInt(BOOKING_CONSTRAINTS.MAX_TIME.split(":")[0], 10);

      if (
        hour < minHour ||
        (hour === maxHour && minute > 0) ||
        hour > maxHour
      ) {
        alert(
          `Booking time must be during business hours (${BOOKING_CONSTRAINTS.MIN_TIME} to ${BOOKING_CONSTRAINTS.MAX_TIME})`
        );
        return;
      }

      // Send the booking request to the server
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_id: property.id,
          scheduled_date: date,
          scheduled_time: time,
        }),
      });

      const data = await res.json();
      alert(data.message || "Booked!");
      setShowModal(false);
    } catch (err) {
      alert("Booking failed.");
    }
  };

  // Show loading state
  if (loading) {
    return <div className="loading">Loading property details...</div>;
  }

  // Show error state
  if (error) {
    return <div className="error">{error}</div>;
  }

  // Show not found state
  if (!property) {
    return <div className="not-found">Property not found.</div>;
  }

  return (
    <div className="property-detail-container">
      {/* Property image */}
      <img
        src={getImageSource(property.image_url)}
        className="property-detail-image"
        alt={property.title}
        onError={(e) => {
          console.warn("Image failed to load:", property.image_url);
          console.log(
            "Attempted image path:",
            getImageSource(property.image_url)
          );
          console.log(
            "Available images in map:",
            Object.keys(imageMap).join(", ")
          );
          e.target.src = defaultImage; // Fallback to default image
        }}
      />

      {/* Main property information */}
      <div className="property-info">
        <h2>{property.title}</h2>
        <p className="location">{property.location}</p>
        <p className="description">{property.description}</p>
        <p className="price">£{parseFloat(property.price).toLocaleString()}</p>

        {/* Quick facts about the property */}
        <div className="summary-cards">
          <div className="info-card">
            <FontAwesomeIcon icon={faBed} />
            <p>{property.bedrooms} Bedrooms</p>
          </div>
          <div className="info-card">
            <FontAwesomeIcon icon={faBath} />
            <p>{property.bathrooms} Bathrooms</p>
          </div>
          <div className="info-card">
            <FontAwesomeIcon icon={faHome} />
            <p>{property.property_type}</p>
          </div>
        </div>

        {/* Contact Agent Section */}
        <div className="agent-contact">
          <h3>Contact Agent</h3>
          <hr />
          {property.agent || (property.agent_id && property.agent_username) ? (
            <div className="agent-details">
              <p className="agent-name">
                {property.agent
                  ? `${property.agent.firstName || ""} ${
                      property.agent.lastName || ""
                    }`
                  : property.agent_username || "Agent"}
              </p>
              <p className="agent-email">
                <strong>Email:</strong>{" "}
                {property.agent?.email ||
                  property.agent_email ||
                  "agent@email.com"}
              </p>
              <p className="agent-phone">
                <strong>Phone:</strong>{" "}
                {property.agent?.phone ||
                  property.agent_phone ||
                  "+44123456789"}
              </p>
            </div>
          ) : (
            <p>Agent information not available</p>
          )}
        </div>

        <button className="book-btn" onClick={() => setShowModal(true)}>
          Book Viewing
        </button>
      </div>

      {/* Booking modal - appears when booking button is clicked */}
      {showModal && (
        <div className="booking-modal">
          <div className="booking-box">
            <h3>Book a Viewing</h3>
            <p>
              <strong>Name:</strong> {userInfo?.user_firstName}{" "}
              {userInfo?.user_lastName}
            </p>
            <p>
              <strong>Email:</strong> {userInfo?.user_email}
            </p>
            <p>
              <strong>Phone:</strong> {userInfo?.user_phone}
            </p>

            <label>
              <FontAwesomeIcon icon={faCalendarAlt} /> Date:
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              <FontAwesomeIcon icon={faClock} /> Time:
              <input
                type="time"
                value={time}
                min={minTime}
                max={maxTime}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button onClick={handleBooking}>Confirm Booking</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
