// src/pages/Favourites.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faBath,
  faHeart as faSolidHeart,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import defaultImage from "../assets/prop1.jpg";
import { hasLink, enhanceResourceWithLinks } from "../services/hateoas";
import API_BASE_URL from "../config/api";

// Import all property images for dynamic loading
import prop1 from "../assets/prop1.jpg";

// Create an image map for easier access
const imageMap = {
  "prop1.jpg": prop1,
};

const Favourites = ({ token }) => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retries, setRetries] = useState(0);

  // Helper function to get the image source
  const getImageSource = (imageName) => {
    if (!imageName) {
      console.log("No image name provided, using default");
      return defaultImage;
    }

    // If the image name is in our map, use it
    if (imageMap[imageName]) {
      return imageMap[imageName];
    }

    // Otherwise try to construct a path (fallback to default if it fails)
    try {
      console.log(`Trying to load image: ${imageName}`);
      return require(`../assets/${imageName}`);
    } catch (error) {
      console.warn(`Image not found: ${imageName}`, error);
      return defaultImage;
    }
  };

  // Function to fetch favorites
  const fetchFavorites = async () => {
    if (!token) {
      console.error("Token not available for fetching favorites");
      setError("Please log in to view your favourites");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[DEBUG] Favourites: Fetching favourites data...");

      const response = await fetch(`${API_BASE_URL}/favourites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store", // Ensure fresh data
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("[DEBUG] Favourites: Authorization failed (401)");
          setError("Your session has expired. Please log in again.");
        } else {
          console.error(`[DEBUG] Favourites: Error status ${response.status}`);
          setError("Failed to load your favourites. Please try again.");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      console.log(
        `[DEBUG] Favourites: Successfully fetched ${
          data.data ? data.data.length : 0
        } favourites`
      );

      if (data && data.data && Array.isArray(data.data)) {
        console.log("[DEBUG] Favourites: Setting favourites data", data.data);
        setFavourites(data.data);
      } else {
        console.warn(
          "[DEBUG] Favourites: Unexpected API response format",
          data
        );
        setFavourites([]);
      }
    } catch (error) {
      console.error("[DEBUG] Favourites: Error during fetch", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to remove a favorite
  const removeFavourite = async (propertyId) => {
    if (!token) {
      console.error("Token not available for removing favorite");
      return;
    }

    try {
      console.log(
        `[DEBUG] Favourites: Removing property ${propertyId} from favourites`
      );

      const response = await fetch(`${API_BASE_URL}/favourites/${propertyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        console.error(
          `[DEBUG] Favourites: Failed to remove favourite: ${response.status}`
        );
        return;
      }

      console.log(
        `[DEBUG] Favourites: Successfully removed property ${propertyId}`
      );

      // Update local state immediately
      setFavourites(
        favourites.filter((p) => {
          const favId = parseInt(p.property_id || p.id, 10);
          return favId !== parseInt(propertyId, 10);
        })
      );

      // Refresh favorites list after a short delay
      setTimeout(() => {
        fetchFavorites();
      }, 100);
    } catch (error) {
      console.error("[DEBUG] Favourites: Error removing favourite:", error);
    }
  };

  // Use useEffect for initial fetch and to retry when token changes
  useEffect(() => {
    console.log(
      "[DEBUG] Favourites: Component mounted or token/retries changed"
    );
    if (token) {
      console.log("[DEBUG] Favourites: Token is present, will fetch data");
      fetchFavorites();
    } else {
      console.log("[DEBUG] Favourites: No token available, won't fetch");
    }
  }, [token, retries]);

  // Add a retry button function
  const handleRetry = () => {
    console.log("[DEBUG] Favourites: Manually retrying fetch...");
    setRetries((prev) => prev + 1);
  };

  return (
    <div className="page">
      <h2>My Favourites</h2>

      {loading ? (
        <p className="loading-message">Loading your favourite properties...</p>
      ) : error ? (
        <div className="error-container">
          <FontAwesomeIcon icon={faHome} className="error-icon" />
          <p className="error-message">{error}</p>
          <button onClick={handleRetry} className="retry-button">
            <FontAwesomeIcon icon={faHome} /> Try Again
          </button>
        </div>
      ) : favourites.length === 0 ? (
        <p className="no-results">You haven't favourited any properties yet.</p>
      ) : (
        <div className="property-grid">
          {favourites.map((p) => {
            // Ensure propertyId is a number
            const propertyId = parseInt(p?.property_id || p?.id, 10);
            return (
              <div className="property-card" key={propertyId || Math.random()}>
                <img
                  src={getImageSource(p?.image_url)}
                  alt={p?.title || "Property"}
                  className="property-image"
                  onError={(e) => {
                    console.log(
                      "[DEBUG] Favourites: Image load error, using fallback"
                    );
                    e.target.onerror = null;
                    e.target.src = defaultImage;
                  }}
                />
                <div className="property-details">
                  <div className="property-header">
                    <h3>{p?.title || "Untitled Property"}</h3>
                    <FontAwesomeIcon
                      icon={faSolidHeart}
                      className="heart-icon favourited"
                      onClick={() => removeFavourite(propertyId)}
                    />
                  </div>
                  <p className="property-location">
                    {p?.location || "Location not specified"}
                  </p>
                  <p>
                    <strong>
                      £
                      {p?.price
                        ? parseFloat(p.price).toLocaleString()
                        : "Price not available"}
                    </strong>
                  </p>
                  <p>
                    <FontAwesomeIcon icon={faBed} /> {p?.bedrooms || "0"}{" "}
                    <FontAwesomeIcon icon={faBath} /> {p?.bathrooms || "0"}
                  </p>
                  <p className="property-type">
                    {p?.property_type || "Not specified"}
                  </p>
                  <Link to={`/property/${propertyId}`} className="details-link">
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favourites;
