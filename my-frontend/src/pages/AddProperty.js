// src/pages/AddProperty.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/AddProperty.css";

const API_BASE_URL = "https://gammacairo-deltareward-9000.codio-box.uk";

// Default image to use if none provided
const DEFAULT_IMAGE = "prop1.jpg";

// Property types allowed - match backend schema capitalization exactly
const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Condo",
  "Townhouse",
  "Land",
  "Villa",
  "Cottage",
  "Penthouse",
  "Terraced",
];

const AddProperty = ({ token, userInfo, isEditing, onPropertyUpdate }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "House",
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

          // Check if the current user is the agent of this property or an admin
          if (
            property.agent_id !== userInfo.user_id &&
            userInfo.user_levels < 2
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
            property_type: property.property_type || "House",
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

    // Validate title
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    } else if (!/^[a-zA-Z0-9\s\.,']+$/.test(formData.title)) {
      errors.title =
        "Title can only contain letters, numbers, spaces, apostrophes (') and periods (.)";
    }

    // Validate description
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length < 20) {
      errors.description = "Description must be at least 20 characters long";
    } else if (formData.description.length > 2000) {
      errors.description = "Description must be less than 2000 characters";
    } else if (
      !/^[a-zA-Z0-9\s\.,\-()&'":;\n\r!?£$€¥\[\]]+$/.test(formData.description)
    ) {
      errors.description = "Description contains invalid characters";
    }

    // Validate price
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be a positive number";
    } else if (parseFloat(formData.price) > 1000000000) {
      errors.price = "Price is too high (maximum 1 billion)";
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      errors.price = "Price can have up to 2 decimal places";
    }

    // Validate location
    if (!formData.location.trim()) {
      errors.location = "Location is required";
    } else if (formData.location.length > 255) {
      errors.location = "Location must be less than 255 characters";
    } else if (!/^[a-zA-Z0-9\s\,.']+$/.test(formData.location)) {
      errors.location =
        "Location can only contain letters, numbers, spaces, commas (,) and apostrophes (')";
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
    } else if (parseInt(formData.bedrooms) > 100) {
      errors.bedrooms = "Number of bedrooms is too high (maximum 100)";
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
    } else if (parseInt(formData.bathrooms) > 100) {
      errors.bathrooms = "Number of bathrooms is too high (maximum 100)";
    }

    // Validate property type
    if (!formData.property_type) {
      errors.property_type = "Property type is required";
    } else if (!PROPERTY_TYPES.includes(formData.property_type)) {
      errors.property_type = "Invalid property type";
    }

    // Validate image URL if provided
    if (formData.image_url && formData.image_url !== DEFAULT_IMAGE) {
      // Check if it's a local file name or URL with a valid image extension
      const validImageRegex =
        /^[a-zA-Z0-9\._-]+\.(jpg|jpeg|png|gif|webp)$|^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([\\/\w\.-]*)*\.(jpg|jpeg|png|gif|webp)$/i;
      if (!validImageRegex.test(formData.image_url)) {
        errors.image_url =
          "Image URL must end with a valid format (.jpg, .jpeg, .png, .gif, .webp)";
      }
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
        if (key === "title") {
          // For title, only allow letters, numbers, spaces, apostrophes, and periods
          sanitized[key] = value
            .trim()
            .replace(/[^a-zA-Z0-9\s\.,']/g, "")
            .substring(0, 255);
        } else if (key === "location") {
          // For location, only allow letters, numbers, spaces, commas, and apostrophes
          sanitized[key] = value
            .trim()
            .replace(/[^a-zA-Z0-9\s\,.']/g, "")
            .substring(0, 255);
        } else if (key === "description") {
          // For description, allow more characters but still sanitize
          const trimmed = value.trim();
          if (trimmed.length < 20) {
            // If description is too short, keep original
            sanitized[key] = trimmed;
          } else {
            // Allow letters, numbers, spaces, common punctuation, and currency symbols
            sanitized[key] = trimmed
              .replace(/[^a-zA-Z0-9\s\.,\-()&'":;\n\r!?£$€¥\[\]]/g, "")
              .substring(0, 2000);
          }
        } else if (key === "image_url") {
          // For image URL, just trim and use default if empty
          const trimmed = value.trim();
          if (!trimmed) {
            sanitized[key] = DEFAULT_IMAGE;
          } else {
            // Check if it has a valid image extension
            const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
            const hasValidExtension = validExtensions.some((ext) =>
              trimmed.toLowerCase().endsWith(ext)
            );

            sanitized[key] = hasValidExtension ? trimmed : DEFAULT_IMAGE;
          }
        } else if (key === "property_type") {
          // For property type, ensure it's one of the allowed values
          sanitized[key] = PROPERTY_TYPES.includes(value) ? value : "House";
        } else {
          // Basic sanitization for other string fields - trim
          sanitized[key] = value.trim();
        }
      } else {
        sanitized[key] = value;
      }
    }

    // Sanitize price as positive number with max 2 decimal places
    if (sanitized.price) {
      const price = parseFloat(sanitized.price);
      if (isNaN(price) || price <= 0) {
        sanitized.price = 1;
      } else if (price > 1000000000) {
        sanitized.price = 1000000000;
      } else {
        // Ensure price has max 2 decimal places
        sanitized.price = Math.round(price * 100) / 100;
      }
    }

    // Sanitize bedrooms as positive integer
    if (sanitized.bedrooms) {
      const bedrooms = parseInt(sanitized.bedrooms, 10);
      sanitized.bedrooms =
        isNaN(bedrooms) || bedrooms <= 0 ? 1 : bedrooms > 100 ? 100 : bedrooms;
    }

    // Sanitize bathrooms as positive integer
    if (sanitized.bathrooms) {
      const bathrooms = parseInt(sanitized.bathrooms, 10);
      sanitized.bathrooms =
        isNaN(bathrooms) || bathrooms <= 0
          ? 1
          : bathrooms > 100
          ? 100
          : bathrooms;
    }

    return sanitized;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success messages

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Prevent non-agents from adding properties
    if (userInfo.user_levels < 1 && !isEditing) {
      setError("Only agents can add properties");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isEditing
        ? `${API_BASE_URL}/properties/${id}`
        : `${API_BASE_URL}/properties`;
      const method = isEditing ? "PUT" : "POST";

      // Clean the form data
      const cleanedData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
      };

      // Sanitize to prevent XSS
      const sanitizedData = sanitizeInputs(cleanedData);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sanitizedData),
      });

      // Check for JSON parse errors in case of invalid response
      let responseData;
      try {
        const jsonText = await response.text();
        responseData = JSON.parse(jsonText);
      } catch (error) {
        console.error("Error parsing response:", error);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        // Handle validation errors from backend
        if (response.status === 400 && responseData.errors) {
          // Format backend errors to match our validation structure
          const backendErrors = {};

          Object.entries(responseData.errors).forEach(([field, message]) => {
            backendErrors[field] = message;
          });

          setValidationErrors(backendErrors);
          throw new Error(responseData.message || "Validation failed");
        }

        throw new Error(responseData.message || "Failed to save property");
      }

      // Get the property ID from the response or use the existing ID for editing
      const propertyId = isEditing
        ? id
        : responseData.property_id || responseData.id || responseData.data?.id;

      if (!propertyId) {
        console.error("No property ID in response:", responseData);
        throw new Error("Failed to get property ID from response");
      }

      // Show success message
      setSuccess(
        isEditing
          ? "Property updated successfully!"
          : "Property created successfully!"
      );

      // If parent passed a callback, call it
      if (onPropertyUpdate) {
        onPropertyUpdate();
      }

      // Wait 2 seconds before redirecting
      setTimeout(() => {
        navigate(`/property/${propertyId}`);
      }, 2000);
    } catch (error) {
      console.error("Error saving property:", error);
      setError(error.message || "Error saving property. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || (userInfo && userInfo.user_levels < 1)) {
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
            maxLength={2000}
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
              maxLength={255}
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
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Land">Land</option>
            <option value="Villa">Villa</option>
            <option value="Cottage">Cottage</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Terraced">Terraced</option>
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
            className={validationErrors.image_url ? "input-error" : ""}
          />
          {validationErrors.image_url && (
            <span className="error-text">{validationErrors.image_url}</span>
          )}
          <div className="helper-text">
            Use 'prop1.jpg' if you don't have an image URL. Image must be in
            .jpg, .jpeg, .png, .gif, or .webp format.
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
