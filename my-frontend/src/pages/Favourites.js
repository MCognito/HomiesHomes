// src/pages/Favourites.js
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faSolidHeart,
  faBed,
  faBath,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import defaultImage from "../assets/prop1.jpg"; // Default fallback image

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

const Favourites = ({ token }) => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavourites = async () => {
    if (!token) {
      setLoading(false);
      setError("Please log in to view your favorites");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/favourites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setFavourites(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching favourites:", err);
      setError("Failed to fetch favorites. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, [token]);

  const removeFavourite = async (property_id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/favourites/${property_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (res.ok) {
        setFavourites((prev) => prev.filter((p) => p.id !== property_id));
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error removing favourite:", errorData);
        alert("Failed to remove this property from favorites");
      }
    } catch (err) {
      console.error("Error removing favourite:", err);
      alert("Failed to remove this property from favorites");
    }
  };

  return (
    <div className="page">
      <h2>My Favourites</h2>

      {loading ? (
        <p className="loading-message">Loading your favourite properties...</p>
      ) : error ? (
        <div className="error-container">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="error-icon"
          />
          <p className="error-message">{error}</p>
        </div>
      ) : favourites.length === 0 ? (
        <p className="no-results">You haven't favourited any properties yet.</p>
      ) : (
        <div className="property-grid">
          {favourites.map((p) => (
            <div className="property-card" key={p.id}>
              <img
                src={
                  p.image_url
                    ? require(`../assets/${p.image_url}`)
                    : defaultImage
                }
                alt={p.title}
                className="property-image"
              />
              <div className="property-details">
                <div className="property-header">
                  <h3>{p.title}</h3>
                  <FontAwesomeIcon
                    icon={faSolidHeart}
                    className="heart-icon favourited"
                    onClick={() => removeFavourite(p.id)}
                  />
                </div>
                <p className="property-location">{p.location}</p>
                <p>
                  <strong>£{parseFloat(p.price).toLocaleString()}</strong>
                </p>
                <p>
                  <FontAwesomeIcon icon={faBed} /> {p.bedrooms}{" "}
                  <FontAwesomeIcon icon={faBath} /> {p.bathrooms}
                </p>
                <p className="property-type">{p.property_type}</p>
                <Link to={`/property/${p.id}`} className="details-link">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favourites;
