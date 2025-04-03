import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import "../styles/PropertyList.css";

const PropertyList = ({ userInfo }) => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    propertyType: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/properties`
        );
        setProperties(response.data.properties);
        setFilteredProperties(response.data.properties);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Failed to load properties. Please try again later.");
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      if (userInfo && userInfo.user_id) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/favorites/${userInfo.user_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setFavorites(
            response.data.favorites.map((fav) => fav.property_id) || []
          );
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      }
    };

    fetchProperties();
    fetchFavorites();
  }, [userInfo]);

  useEffect(() => {
    // Apply filters when properties change
    applyFilters();
  }, [properties]);

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.minPrice) {
      filtered = filtered.filter(
        (property) => property.price >= parseFloat(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(
        (property) => property.price <= parseFloat(filters.maxPrice)
      );
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(
        (property) => property.bedrooms >= parseInt(filters.bedrooms)
      );
    }

    if (filters.propertyType) {
      filtered = filtered.filter(
        (property) =>
          property.property_type.toLowerCase() ===
          filters.propertyType.toLowerCase()
      );
    }

    setFilteredProperties(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const toggleFavorite = async (propertyId) => {
    if (!userInfo || !userInfo.user_id) {
      alert("Please log in to add favorites");
      return;
    }

    try {
      if (favorites.includes(propertyId)) {
        // Remove from favorites
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/favorites/${userInfo.user_id}/${propertyId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setFavorites(favorites.filter((id) => id !== propertyId));
      } else {
        // Add to favorites
        await axios.post(
          `${process.env.REACT_APP_API_URL}/favorites`,
          {
            user_id: userInfo.user_id,
            property_id: propertyId,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setFavorites([...favorites, propertyId]);
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  const resetFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      propertyType: "",
    });
    setFilteredProperties(properties);
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="property-list-container">
      <div className="filter-sidebar">
        <h3>Filter Properties</h3>
        <form onSubmit={handleSubmit}>
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
              <span>to</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Bedrooms (min)</label>
            <input
              type="number"
              name="bedrooms"
              placeholder="Minimum Bedrooms"
              value={filters.bedrooms}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Property Type</label>
            <select
              name="propertyType"
              value={filters.propertyType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
            </select>
          </div>

          <div className="filter-buttons">
            <button type="submit" className="apply-btn">
              Apply Filters
            </button>
            <button type="button" className="reset-btn" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="property-grid">
        {filteredProperties.length > 0 ? (
          <>
            <div className="results-count">
              {filteredProperties.length}{" "}
              {filteredProperties.length === 1 ? "property" : "properties"}{" "}
              found
            </div>
            <div className="properties">
              {filteredProperties.map((property) => (
                <div key={property.property_id} className="property-card">
                  <div className="property-image">
                    <img
                      src={`${process.env.REACT_APP_IMAGE_URL}/${property.image_url}`}
                      alt={property.title}
                    />
                    {userInfo && (
                      <button
                        className="favorite-btn"
                        onClick={() => toggleFavorite(property.property_id)}
                      >
                        <FontAwesomeIcon
                          icon={
                            favorites.includes(property.property_id)
                              ? solidHeart
                              : regularHeart
                          }
                          className={
                            favorites.includes(property.property_id)
                              ? "favorited"
                              : ""
                          }
                        />
                      </button>
                    )}
                  </div>
                  <div className="property-details">
                    <h3>{property.title}</h3>
                    <p className="property-location">{property.location}</p>
                    <p className="property-price">£{property.price}</p>
                    <div className="property-features">
                      <span>{property.bedrooms} beds</span>
                      <span>{property.bathrooms} baths</span>
                      <span>{property.property_type}</span>
                    </div>
                    <Link
                      to={`/properties/${property.property_id}`}
                      className="view-btn"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-properties">
            <h3>No properties match your criteria</h3>
            <p>Try adjusting your filters or browse all properties.</p>
            <button onClick={resetFilters} className="browse-all-btn">
              Browse All Properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyList;
