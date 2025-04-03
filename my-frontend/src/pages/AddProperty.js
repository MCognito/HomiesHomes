// src/pages/AddProperty.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/AddProperty.css";

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

// Default image to use if none provided
const DEFAULT_IMAGE = "prop1.jpg";

// Property types allowed
const PROPERTY_TYPES = [
  "house",
  "apartment",
  "condo",
  "townhouse",
  "land",
  "Apartment",
  "Terraced",
  "Cottage",
  "Villa",
  "Penthouse",
];

const AddProperty = ({ token, userInfo, isEditing }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "house",
    image_url: DEFAULT_IMAGE,
    agent_id: userInfo?.user_id || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch property data if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchPropertyData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch property data");
          }

          const propertyData = await response.json();
          const property = propertyData.data;

          // Check if the current user is the agent of this property
          if (
            property.agent_id !== userInfo.user_id &&
            userInfo.user_level < 2
          ) {
            setError("You don't have permission to edit this property");
            setIsLoading(false);
            return;
          }

          setFormData({
            title: property.title || "",
            description: property.description || "",
            price: property.price || "",
            location: property.location || "",
            bedrooms: property.bedrooms || "",
            bathrooms: property.bathrooms || "",
            property_type: property.property_type || "house",
            image_url: property.image_url || DEFAULT_IMAGE,
            agent_id: property.agent_id || userInfo.user_id,
          });

          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching property:", error);
          setError("Error loading property data. Please try again.");
          setIsLoading(false);
        }
      };

      fetchPropertyData();
    }
  }, [id, isEditing, token, userInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: "",
      });
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    // Validate title (prevent XSS)
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    } else if (/[<>&;]|&amp;|&lt;|&gt;/.test(formData.title)) {
      errors.title =
        "Title cannot contain special characters like <, >, &, or ;";
    } else if (!/^[a-zA-Z0-9\s.,!?'"-]+$/.test(formData.title)) {
      errors.title =
        "Title can only contain letters, numbers, spaces, and basic punctuation";
    }

    // Validate description (prevent XSS)
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }

    // Validate price
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    } else if (parseFloat(formData.price) > 100000000) {
      errors.price = "Price is too high";
    }

    // Validate location
    if (!formData.location.trim()) {
      errors.location = "Location is required";
    } else if (formData.location.length > 100) {
      errors.location = "Location must be less than 100 characters";
    }

    // Validate bedrooms
    if (!formData.bedrooms) {
      errors.bedrooms = "Number of bedrooms is required";
    } else if (
      isNaN(formData.bedrooms) ||
      !Number.isInteger(parseFloat(formData.bedrooms)) ||
      parseInt(formData.bedrooms) <= 0
    ) {
      errors.bedrooms = "Bedrooms must be a positive whole number";
    } else if (parseInt(formData.bedrooms) > 50) {
      errors.bedrooms = "Number of bedrooms is too high";
    }

    // Validate bathrooms
    if (!formData.bathrooms) {
      errors.bathrooms = "Number of bathrooms is required";
    } else if (
      isNaN(formData.bathrooms) ||
      !Number.isInteger(parseFloat(formData.bathrooms)) ||
      parseInt(formData.bathrooms) <= 0
    ) {
      errors.bathrooms = "Bathrooms must be a positive whole number";
    } else if (parseInt(formData.bathrooms) > 50) {
      errors.bathrooms = "Number of bathrooms is too high";
    }

    // Validate property type
    if (!formData.property_type) {
      errors.property_type = "Property type is required";
    } else if (!PROPERTY_TYPES.includes(formData.property_type)) {
      errors.property_type = "Invalid property type";
    }

    // Set validation errors
    setValidationErrors(errors);

    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  // Function to sanitize inputs
  const sanitizeInputs = (data) => {
    const sanitized = {};

    // For each field in the form data
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        // Different sanitization based on field type
        if (key === "title" || key === "location") {
          // For title and location, only allow alphanumeric chars and basic punctuation
          sanitized[key] = value
            .trim()
            .replace(/[^a-zA-Z0-9\s.,!?'"-]/g, "")
            .substring(0, key === "title" ? 100 : 100);
        } else if (key === "description") {
          // For description, allow more characters but still sanitize HTML
          sanitized[key] = value
            .trim()
            .replace(/</g, "")
            .replace(/>/g, "")
            .replace(/&/g, "")
            .replace(/;/g, "")
            .substring(0, 1000);
        } else if (key === "image_url") {
          // For image URL, just trim and limit length
          sanitized[key] = value.trim() || DEFAULT_IMAGE;
        } else if (key === "property_type") {
          // For property type, ensure it's one of the allowed values
          sanitized[key] = PROPERTY_TYPES.includes(value) ? value : "house";
        } else {
          // Basic sanitization for other string fields - trim
          sanitized[key] = value.trim();
        }
      } else {
        sanitized[key] = value;
      }
    }

    // Convert numeric fields
    if (sanitized.price) {
      const price = parseFloat(sanitized.price);
      sanitized.price = isNaN(price) || price <= 0 ? 1 : price;
    }

    if (sanitized.bedrooms) {
      const bedrooms = parseInt(sanitized.bedrooms, 10);
      sanitized.bedrooms =
        isNaN(bedrooms) || bedrooms <= 0 ? 1 : bedrooms > 50 ? 50 : bedrooms;
    }

    if (sanitized.bathrooms) {
      const bathrooms = parseInt(sanitized.bathrooms, 10);
      sanitized.bathrooms =
        isNaN(bathrooms) || bathrooms <= 0
          ? 1
          : bathrooms > 50
          ? 50
          : bathrooms;
    }

    return sanitized;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      setIsLoading(false);
      setError("Please correct the errors in the form");
      return;
    }

    try {
      // Sanitize and prepare the request data
      const sanitizedData = sanitizeInputs(formData);

      // If image_url is empty, use the default
      if (!sanitizedData.image_url) {
        sanitizedData.image_url = DEFAULT_IMAGE;
      }

      const url = isEditing
        ? `${API_BASE_URL}/properties/${id}`
        : `${API_BASE_URL}/properties`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save property");
      }

      const result = await response.json();
      setSuccess(
        isEditing
          ? "Property updated successfully!"
          : "Property added successfully!"
      );

      // Redirect after successful submission
      setTimeout(() => {
        navigate(isEditing ? `/property/${id}` : "/properties");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || (userInfo && userInfo.user_level < 1)) {
    return (
      <div className="add-property-container">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="add-property-container">
      <h1>{isEditing ? "Edit Property" : "Add New Property"}</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-group">
          <label htmlFor="title">Property Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter property title"
            required
            maxLength={100}
            className={validationErrors.title ? "input-error" : ""}
          />
          {validationErrors.title && (
            <span className="error-text">{validationErrors.title}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the property"
            required
            maxLength={1000}
            className={validationErrors.description ? "input-error" : ""}
          />
          {validationErrors.description && (
            <span className="error-text">{validationErrors.description}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price (£)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Enter price"
              required
              min="1"
              step="any"
              className={validationErrors.price ? "input-error" : ""}
            />
            {validationErrors.price && (
              <span className="error-text">{validationErrors.price}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter location"
              required
              maxLength={100}
              className={validationErrors.location ? "input-error" : ""}
            />
            {validationErrors.location && (
              <span className="error-text">{validationErrors.location}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              type="number"
              id="bedrooms"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleInputChange}
              placeholder="Number of bedrooms"
              required
              min="1"
              step="1"
              className={validationErrors.bedrooms ? "input-error" : ""}
            />
            {validationErrors.bedrooms && (
              <span className="error-text">{validationErrors.bedrooms}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input
              type="number"
              id="bathrooms"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleInputChange}
              placeholder="Number of bathrooms"
              required
              min="1"
              step="1"
              className={validationErrors.bathrooms ? "input-error" : ""}
            />
            {validationErrors.bathrooms && (
              <span className="error-text">{validationErrors.bathrooms}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="property_type">Property Type</label>
          <select
            id="property_type"
            name="property_type"
            value={formData.property_type}
            onChange={handleInputChange}
            required
            className={validationErrors.property_type ? "input-error" : ""}
          >
            <option value="">Select property type</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="land">Land</option>
            <option value="Terraced">Terraced</option>
            <option value="Cottage">Cottage</option>
            <option value="Villa">Villa</option>
            <option value="Penthouse">Penthouse</option>
          </select>
          {validationErrors.property_type && (
            <span className="error-text">{validationErrors.property_type}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="image_url">Image URL</label>
          <input
            type="text"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            placeholder="Enter image URL or use prop1.jpg"
          />
          <div className="helper-text">
            Use 'prop1.jpg' if you don't have an image URL
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : isEditing
              ? "Update Property"
              : "Add Property"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProperty;
