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

const PropertyDetails = ({ property, token, userData }) => {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleBooking = async () => {
    try {
      const res = await fetch("https://gammacairo-deltareward-9000.codio-box.uk/bookings", {
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

  return (
    <div className="property-detail-container">
      <img
        src={property.image_url}
        className="property-detail-image"
        alt={property.title}
      />

      <div className="property-info">
        <h2>{property.title}</h2>
        <p className="location">{property.location}</p>
        <p className="description">{property.description}</p>
        <p className="price">£{parseFloat(property.price).toLocaleString()}</p>

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
