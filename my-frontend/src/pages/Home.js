/**
 * Home Page
 * The main landing page with search and featured properties
 */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSliders,
  faBed,
  faBath,
  faHeart as faSolidHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import defaultImage from "../assets/prop1.jpg";

// Load property images to use them dynamically
import prop1 from "../assets/prop1.jpg";

// Quick lookup for property images by filename
const imageMap = {
  "prop1.jpg": prop1,
};

const API_BASE_URL = "https://gammacairo-deltareward-3000.codio-box.uk";

// Price choices for the dropdown menu
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

// Types of properties users can select
const PROPERTY_TYPES = [
  "Apartment",
  "Terraced",
  "Cottage",
  "Villa",
  "Penthouse",
];

/**
 * Home page component with search and featured listings
 */
const Home = ({ onSearch, userInfo, token }) => {
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search filters for finding properties
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [maxBathrooms, setMaxBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Properties to display on the page
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [validationError, setValidationError] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Keep all search filters in one place
  const [filters, setFilters] = useState({
    location: "",
    minBedrooms: "",
    maxBedrooms: "",
    minBathrooms: "",
    maxBathrooms: "",
    property_type: "",
    minPrice: "",
    maxPrice: "",
  });

  // Update a single filter when user changes value
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Show properties when the page first loads
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/properties?limit=3`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();

        if (data.data) {
          setFeaturedProperties(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch featured properties:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, [token]); // Refresh when user logs in or out

  // Get the user's favorite properties if they're logged in
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!token) return;

      try {
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
        setFavourites(favIds);
      } catch (err) {
        console.error("Failed to fetch favourites:", err);
      }
    };

    if (token) fetchFavourites();
  }, [token]);

  // Process the search form when submitted
  const handleSearch = (e) => {
    e.preventDefault();
    setValidationError("");

    // Create the search query from all the filters
    const queryParams = new URLSearchParams();

    // Only add filters that have values
    if (filters.location) {
      queryParams.append("location", filters.location);
    }

    if (filters.minBedrooms) {
      queryParams.append("minBedrooms", filters.minBedrooms);
    }
    if (filters.maxBedrooms) {
      queryParams.append("maxBedrooms", filters.maxBedrooms);
    }

    if (filters.minBathrooms) {
      queryParams.append("minBathrooms", filters.minBathrooms);
    }
    if (filters.maxBathrooms) {
      queryParams.append("maxBathrooms", filters.maxBathrooms);
    }

    if (filters.property_type) {
      queryParams.append("property_type", filters.property_type);
    }

    if (filters.minPrice) {
      queryParams.append("minPrice", filters.minPrice);
    }
    if (filters.maxPrice) {
      queryParams.append("maxPrice", filters.maxPrice);
    }

    queryParams.append("_t", Date.now());

    // Build the final URL for the search
    const url = `${API_BASE_URL}/properties?${queryParams.toString()}`;

    setSearchUrl(url);
    setIsLoading(true);
  };

  // Helper function to handle favoriting
  const isFavourited = (id) => {
    return favourites.includes(Number(id));
  };

  const toggleFavourite = async (property_id) => {
    if (!token) {
      alert("Please log in to add favorites");
      return;
    }

    const favNow = isFavourited(property_id);

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

  // Clear filters function
  const clearFilters = () => {
    setFilters({
      location: "",
      minBedrooms: "",
      maxBedrooms: "",
      minBathrooms: "",
      maxBathrooms: "",
      property_type: "",
      minPrice: "",
      maxPrice: "",
    });
    setIsFiltered(false);
    setFilteredProperties([]);
    setValidationError("");
  };

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

  // Properties to display: filtered if a search has been done, otherwise featured
  const propertiesToDisplay = isFiltered
    ? filteredProperties
    : featuredProperties;

  // Fetch properties when searchUrl changes
  useEffect(() => {
    if (!searchUrl) return;

    const fetchFilteredProperties = async () => {
      try {
        const res = await fetch(searchUrl, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          // Handle validation errors
          if (res.status === 400) {
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

        if (data.data) {
          setFilteredProperties(data.data);
          setIsFiltered(true);
          setValidationError(""); // Clear any previous errors on success
        }
      } catch (err) {
        console.error("Search failed:", err);
        setValidationError(
          err.message || "An error occurred while searching. Please try again."
        );
        setFilteredProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredProperties();
  }, [searchUrl, token]);

  return (
    <>
      <div className="hero">
        <div className="hero-content">
          <h1 className="headline">Find Your Dream Home</h1>
          <p className="subhead">
            We help you search, filter and find the right home at the right
            price.
          </p>

          {/* Search Bar Row */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search Location"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />

            <button
              className={`search-btn ${isLoading ? "loading" : ""}`}
              onClick={handleSearch}
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faSearch} />{" "}
              {isLoading ? "Searching..." : "Search"}
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

          {/* Filter Section - Updated with Min/Max UI */}
          {showFilters && (
            <div className="filters-panel">
              {/* Bedrooms Range */}
              <div className="filter-row range-inputs">
                <div className="input-with-label">
                  <label>Bedrooms</label>
                  <div className="range-input">
                    <select
                      value={filters.minBedrooms}
                      onChange={(e) =>
                        handleFilterChange("minBedrooms", e.target.value)
                      }
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
                      value={filters.maxBedrooms}
                      onChange={(e) =>
                        handleFilterChange("maxBedrooms", e.target.value)
                      }
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
                      value={filters.minBathrooms}
                      onChange={(e) =>
                        handleFilterChange("minBathrooms", e.target.value)
                      }
                    >
                      <option value="">Min</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                    <span>to</span>
                    <select
                      value={filters.maxBathrooms}
                      onChange={(e) =>
                        handleFilterChange("maxBathrooms", e.target.value)
                      }
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
                    value={filters.property_type}
                    onChange={(e) =>
                      handleFilterChange("property_type", e.target.value)
                    }
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
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                    >
                      <option value="">Min</option>
                      {PRICE_OPTIONS.slice(1).map((option) => (
                        <option
                          key={`min-${option.value}`}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span>to</span>
                    <select
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                    >
                      <option value="">Max</option>
                      {PRICE_OPTIONS.slice(1).map((option) => (
                        <option
                          key={`max-${option.value}`}
                          value={option.value}
                        >
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
      </div>

      {/* Properties Section */}
      <div className="featured-properties">
        <h2>{isFiltered ? "Search Results" : "Featured Properties"}</h2>

        {loading ? (
          <p className="loading-message">Loading properties...</p>
        ) : propertiesToDisplay.length === 0 ? (
          <p className="no-results">
            {isFiltered
              ? "No properties match your search criteria."
              : "No featured properties available."}
          </p>
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
                        icon={
                          isFavourited(p.id) ? faSolidHeart : faRegularHeart
                        }
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

        {featuredProperties.length > 0 && !isFiltered && (
          <div className="view-all-link">
            <Link to="/properties">View All Properties</Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
