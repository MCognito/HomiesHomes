import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

// Import all property images for dynamic loading
import prop1 from "../assets/prop1.jpg";

// Create an image map for easier access
const imageMap = {
  "prop1.jpg": prop1,
};

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

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

const Properties = ({ properties, token, userInfo }) => {
  const [favourites, setFavourites] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [location, setLocation] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [maxBathrooms, setMaxBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Initialize with all properties
  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  // Fetch favorites once on component mount or when token changes
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/favourites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          console.error(`Error fetching favourites: ${res.status}`);
          return;
        }

        const data = await res.json();
        const favIds = data.data
          ? data.data.map((p) => p.property_id || p.id)
          : [];
        console.log("Fetched favorites:", favIds);
        setFavourites(favIds);
      } catch (err) {
        console.error("Failed to fetch favourites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, [token]);

  const isFavourited = (id) => {
    return favourites.includes(Number(id));
  };

  const toggleFavourite = async (property_id) => {
    if (!token) {
      alert("Please log in to add favorites");
      return;
    }

    const favNow = isFavourited(property_id);
    console.log(`Toggling favorite for property ${property_id}`);

    try {
      const res = await fetch(
        `${API_BASE_URL}/favourites${favNow ? `/${property_id}` : ""}`,
        {
          method: favNow ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: favNow ? undefined : JSON.stringify({ property_id }),
        }
      );

      if (res.ok) {
        setFavourites((prev) =>
          favNow
            ? prev.filter((id) => id !== Number(property_id))
            : [...prev, Number(property_id)]
        );
      } else {
        console.error(`Failed to toggle favorite: ${res.status}`);
      }
    } catch (err) {
      console.error("Favourite toggle failed:", err);
    }
  };

  const handleSearch = async () => {
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
      // Construct query string
      const query = new URLSearchParams(cleanedFilters).toString();
      const res = await fetch(`${API_BASE_URL}/properties?${query}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();

      if (data.data) {
        setFilteredProperties(data.data);
        setIsFiltered(true);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setLocation("");
    setMinBedrooms("");
    setMaxBedrooms("");
    setMinBathrooms("");
    setMaxBathrooms("");
    setPropertyType("");
    setMinPrice("");
    setMaxPrice("");
    setIsFiltered(false);
    setFilteredProperties(properties); // Reset to all properties
  };

  // Properties to display
  const propertiesToDisplay = isFiltered ? filteredProperties : properties;

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

  return (
    <div className="page">
      <h2>All Properties</h2>

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
            <FontAwesomeIcon icon={faSearch} /> Search
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
        <p className="no-results">No properties matching your criteria.</p>
      ) : (
        <div className="property-grid">
          {propertiesToDisplay.map((p) => (
            <div className="property-card" key={p.id}>
              <img
                src={getImageSource(p.image_url)}
                alt={p.title}
                className="property-image"
              />

              <div className="property-details">
                <div className="property-header">
                  <h3>{p.title}</h3>
                  {token && (
                    <FontAwesomeIcon
                      icon={isFavourited(p.id) ? faSolidHeart : faRegularHeart}
                      className={`heart-icon ${
                        isFavourited(p.id) ? "favourited" : ""
                      }`}
                      onClick={() => toggleFavourite(p.id)}
                    />
                  )}
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

                {/* Agent information */}
                {p.agent && (
                  <p className="property-agent">
                    Agent: {p.agent.firstName} {p.agent.lastName}
                  </p>
                )}

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

export default Properties;
