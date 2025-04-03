import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faBath,
  faSearch,
  faSliders,
  faHeart as faSolidHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import defaultImage from "../assets/prop1.jpg"; // Default fallback image
import { hasLink, enhanceResourceWithLinks } from "../services/hateoas";
import API_BASE_URL from "../config/api";

// Import all property images for dynamic loading
import prop1 from "../assets/prop1.jpg";

// Create an image map for easier access
const imageMap = {
  "prop1.jpg": prop1,
};

// Price options for dropdown
const PRICE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "50000", label: "£50,000" },
  { value: "100000", label: "£100,000" },
  { value: "200000", label: "£200,000" },
  { value: "300000", label: "£300,000" },
  { value: "500000", label: "£500,000" },
  { value: "750000", label: "£750,000" },
  { value: "1000000", label: "£1,000,000" },
  { value: "2000000", label: "£2,000,000" },
];

// Property type options
const PROPERTY_TYPES = [
  "Apartment",
  "Terraced",
  "Cottage",
  "Villa",
  "Penthouse",
];

const Properties = ({ properties, token, userInfo, refreshProperties }) => {
  const [favourites, setFavourites] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const locationPath = useLocation();

  // Filter states
  const [location, setLocation] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [maxBathrooms, setMaxBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Update filtered properties when main properties change
  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  // Fetch favorites only
  const fetchFavorites = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/favourites`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result && result.data) {
        const favoriteIds = result.data.map((fav) =>
          parseInt(fav.property_id || fav.id, 10)
        );
        setFavourites(favoriteIds);
      }
    } catch (error) {
      console.error("Favorites fetch error:", error);
    }
  }, [token]);

  // Initial load of favorites
  useEffect(() => {
    let mounted = true;

    const loadFavorites = async () => {
      if (token && mounted) {
        await fetchFavorites();
      }
    };

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [token, fetchFavorites]);

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    await refreshProperties();
    if (token) {
      await fetchFavorites();
    }
    setLoading(false);
  };

  const isFavourited = (id) => {
    return favourites.includes(Number(id));
  };

  // Toggle favorite with debounce
  const toggleFavourite = useCallback(
    async (property_id) => {
      if (!token) {
        alert("Please log in to add favorites");
        return;
      }

      try {
        const favNow = isFavourited(property_id);
        const options = {
          method: favNow ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        if (!favNow) {
          options.body = JSON.stringify({ property_id });
        }

        const endpoint = favNow ? `/favourites/${property_id}` : "/favourites";
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.ok) {
          setFavourites((prev) =>
            favNow
              ? prev.filter((id) => id !== property_id)
              : [...prev, property_id]
          );
        }
      } catch (err) {
        console.error("Favourite toggle failed:", err);
      }
    },
    [token, isFavourited]
  );

  const handleSearch = async () => {
    setValidationError(""); // Clear any previous errors
    // Build filter parameters with min/max values
    const filters = {
      location,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      propertyType,
      minPrice,
      maxPrice,
    };

    // Remove empty values
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );

    setLoading(true);
    try {
      // Add timestamp to make URL unique
      cleanedFilters._t = Date.now();

      // Construct query string
      const query = new URLSearchParams(cleanedFilters).toString();
      console.log("[FIX] Properties: Searching with query:", query);

      // Direct fetch with no caching
      const response = await fetch(`${API_BASE_URL}/properties?${query}`, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400) {
          const errorMessage =
            typeof data.error === "object"
              ? data.error.message || "Invalid search request"
              : data.error ||
                "Invalid search request. Please check your search criteria.";
          setValidationError(errorMessage);
          setFilteredProperties([]);
          setIsFiltered(true);
          return;
        }
        throw new Error(
          typeof data.message === "string" ? data.message : "Search failed"
        );
      }

      if (data && data.data) {
        console.log(
          `[FIX] Properties: Search found ${data.data.length} properties`
        );
        setFilteredProperties(data.data);
        setIsFiltered(true);
        setValidationError(""); // Clear any errors on success
        console.log(
          "[DEBUG] Properties: Updated lastLoadTime after search to",
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error("[FIX] Properties: Search exception:", error);
      setValidationError(
        error.message || "An error occurred while searching. Please try again."
      );
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setMinBedrooms("");
    setMaxBedrooms("");
    setMinBathrooms("");
    setMaxBathrooms("");
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setIsFiltered(false);
    setLoading(true);

    console.log("[FIX] Properties: Clearing filters, reloading all properties");

    // Reload all properties
    fetch(`${API_BASE_URL}/properties`, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (result && result.data) {
          console.log(
            `[FIX] Properties: Loaded ${result.data.length} properties after clearing filters`
          );
          setFilteredProperties(result.data);
          console.log(
            "[DEBUG] Properties: Updated lastLoadTime after clearing filters to",
            new Date().toISOString()
          );
        }
      })
      .catch((error) => {
        console.error(
          "[FIX] Properties: Error refreshing after clear filters:",
          error
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Properties to display
  const propertiesToDisplay = filteredProperties;

  // Helper function to get the image source
  const getImageSource = (imageName) => {
    if (!imageName) return defaultImage;

    if (imageMap[imageName]) {
      return imageMap[imageName];
    }


    try {
      return require(`../assets/${imageName}`);
    } catch (error) {
      console.warn(`Image not found: ${imageName}`, error);
      return defaultImage;
    }
  };

  // Add handler for HATEOAS links
  const handleLinkAction = (action) => {
    console.log("Following HATEOAS link:", action);
    // Handle link actions as needed
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>All Properties</h2>
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Properties"}
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="properties-search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSearch} />{" "}
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            className="filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faSliders} /> Filters
          </button>

          {isFiltered && (
            <button className="clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {validationError && (
          <div className="error-message">{validationError}</div>
        )}

        {/* Filter Section - Updated UI */}
        {showFilters && (
          <div className="filters-panel">
            {/* Bedrooms Range */}
            <div className="filter-row range-inputs">
              <div className="input-with-label">
                <label>Bedrooms</label>
                <div className="range-input">
                  <select
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                  >
                    <option value="">Min</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                  <span>to</span>
                  <select
                    value={maxBedrooms}
                    onChange={(e) => setMaxBedrooms(e.target.value)}
                  >
                    <option value="">Max</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bathrooms Range */}
            <div className="filter-row range-inputs">
              <div className="input-with-label">
                <label>Bathrooms</label>
                <div className="range-input">
                  <select
                    value={minBathrooms}
                    onChange={(e) => setMinBathrooms(e.target.value)}
                  >
                    <option value="">Min</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  <span>to</span>
                  <select
                    value={maxBathrooms}
                    onChange={(e) => setMaxBathrooms(e.target.value)}
                  >
                    <option value="">Max</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Property Type */}
            <div className="filter-row">
              <div className="filter-group">
                <label>Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Any</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="filter-row range-inputs">
              <div className="input-with-label">
                <label>Price Range</label>
                <div className="range-input">
                  <select
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  >
                    <option value="">Min</option>
                    {PRICE_OPTIONS.slice(1).map((option) => (
                      <option key={`min-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span>to</span>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  >
                    <option value="">Max</option>
                    {PRICE_OPTIONS.slice(1).map((option) => (
                      <option key={`max-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Properties Grid */}
      {loading ? (
        <p className="loading-message">Loading properties...</p>
      ) : propertiesToDisplay.length === 0 ? (
        <div className="no-results">
          <p>
            No properties found. The database may be empty or there may be a
            connection issue.
          </p>
          <button
            className="browse-all-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            Reload Properties
          </button>
          {isFiltered && (
            <button className="browse-all-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="property-grid">
          {propertiesToDisplay.map((property) => {
            // Get consistent numeric ID
            const propertyId = parseInt(
              property.id || property.property_id,
              10
            );

            return (
              <div className="property-card" key={propertyId}>
                <img
                  src={getImageSource(property.image_url)}
                  alt={property.title || "Property"}
                  className="property-image"
                  onError={(e) => {
                    console.warn("Image failed to load:", property.image_url);
                    e.target.src = defaultImage; // Fallback to default image
                  }}
                />

                <div className="property-details">
                  <div className="property-header">
                    <h3>{property.title || "Unnamed Property"}</h3>
                    {token && (
                      <FontAwesomeIcon
                        icon={
                          isFavourited(propertyId)
                            ? faSolidHeart
                            : faRegularHeart
                        }
                        className={`heart-icon ${
                          isFavourited(propertyId) ? "favourited" : ""
                        }`}
                        onClick={() => toggleFavourite(propertyId)}
                      />
                    )}
                  </div>

                  <p className="property-location">
                    {property.location || "Location not specified"}
                  </p>
                  <p>
                    <strong>
                      £{parseFloat(property.price || 0).toLocaleString()}
                    </strong>
                  </p>
                  <div className="property-features">
                    <span>
                      <FontAwesomeIcon icon={faBed} /> {property.bedrooms || 0}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faBath} />{" "}
                      {property.bathrooms || 0}
                    </span>
                    <span>{property.property_type || "Not specified"}</span>
                  </div>

                  {/* Agent information */}
                  {property.agent && (
                    <p className="property-agent">
                      Agent: {property.agent.firstName || ""}{" "}
                      {property.agent.lastName || ""}
                    </p>
                  )}

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

export default Properties;
