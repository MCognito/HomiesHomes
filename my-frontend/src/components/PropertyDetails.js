import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faBath,
  faHome,
  faCalendarAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import "./PropertyDetails.css";

/**
 * Property detail card with booking functionality
 * Shows a property with all its details and allows users to book viewings
 */
const PropertyDetails = ({ property, token, userData }) => {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Send booking request to the API
  const handleBooking = async () => {
    try {
      // Make sure we have required fields
      if (!date || !time) {
        alert("Please select both date and time for your viewing");
        return;
      }

      // Send the booking request to the server
      const res = await fetch(
        "https://gammacairo-deltareward-3000.codio-box.uk/bookings",
        {
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
        }
      );

      const data = await res.json();
      alert(data.message || "Booked!");
      setShowModal(false);
    } catch (err) {
      alert("Booking failed.");
    }
  };

  return (
    <div className="property-detail-container">
      {/* Property image */}
      <img
        src={property.image_url}
        className="property-detail-image"
        alt={property.title}
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
              <strong>Name:</strong> {userData?.user_firstName}{" "}
              {userData?.user_lastName}
            </p>
            <p>
              <strong>Email:</strong> {userData?.user_email}
            </p>
            <p>
              <strong>Phone:</strong> {userData?.user_phone}
            </p>

            <label>
              <FontAwesomeIcon icon={faCalendarAlt} /> Date:
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              <FontAwesomeIcon icon={faClock} /> Time:
              <input
                type="time"
                value={time}
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
