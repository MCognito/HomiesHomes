/**
 * Validation helpers for request data
 * Checks that input data meets the required format
 */


 // Creates a validator to check incoming data

const createValidator = (schema, source = "body") => {
  return async (ctx, next) => {
    // Grab the data we need to check
    const data =
      source === "body"
        ? ctx.request.body
        : source === "query"
        ? ctx.query
        : source === "params"
        ? ctx.params
        : ctx.request.body;

    // Keep track of any validation problems
    const validationErrors = {};

    // Run each field through its validator function
    for (const [field, validator] of Object.entries(schema)) {
      const value = data[field];

      // Skip if validator isn't a function
      if (typeof validator === "function") {
        try {
          const result = validator(value, data);
          if (result !== true) {
            validationErrors[field] = result || `Invalid ${field}`;
          }
        } catch (error) {
          validationErrors[field] =
            error.message || `Error validating ${field}`;
        }
      }
    }

    // Stop the request if anything failed validation
    if (Object.keys(validationErrors).length > 0) {
      ctx.status = 400;
      ctx.body = {
        message: "Validation failed",
        errors: validationErrors,
      };
      return;
    }

    // continue processing the request
    await next();
  };
};

/**
 * Ready-to-use validation functions
 */
const Validators = {
  required: (value) => {
    if (value === undefined || value === null || value === "") {
      return "This field is required";
    }
    return true;
  },

  string: (value) => {
    if (value !== undefined && value !== null && typeof value !== "string") {
      return "Must be a string";
    }
    return true;
  },

  number: (value) => {
    if (value !== undefined && value !== null && isNaN(Number(value))) {
      return "Must be a number";
    }
    return true;
  },

  integer: (value) => {
    if (value !== undefined && value !== null) {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return "Must be an integer";
      }
    }
    return true;
  },

  positiveNumber: (value) => {
    if (value !== undefined && value !== null) {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return "Must be a positive number";
      }
    }
    return true;
  },

  email: (value) => {
    if (value !== undefined && value !== null && value !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Invalid email format";
      }
    }
    return true;
  },

  futureDate: (value) => {
    if (value !== undefined && value !== null && value !== "") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return "Date must be in YYYY-MM-DD format";
      }

      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate < today || isNaN(inputDate.getTime())) {
        return "Date must be in the future";
      }
    }
    return true;
  },

  timeFormat: (value) => {
    if (value !== undefined && value !== null && value !== "") {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value)) {
        return "Time must be in HH:MM format (24-hour)";
      }
    }
    return true;
  },

  minLength: (min) => (value) => {
    if (value !== undefined && value !== null && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return true;
  },

  maxLength: (max) => (value) => {
    if (value !== undefined && value !== null && value.length > max) {
      return `Must be less than ${max} characters`;
    }
    return true;
  },

  oneOf: (options) => (value) => {
    if (value !== undefined && value !== null && !options.includes(value)) {
      return `Must be one of: ${options.join(", ")}`;
    }
    return true;
  },
};


const sanitizeString = (str, fieldType = "default") => {
  if (!str || typeof str !== "string") return "";

  const trimmed = str.trim();

  // Different sanitization based on field type
  switch (fieldType) {
    case "title":
    case "location":
      // For titles and locations, only allow alphanumeric and basic punctuation
      return trimmed.replace(/[^a-zA-Z0-9\s.,!?'"-]/g, "").substring(0, 100);

    case "property_type":
      // For property type, allow only letters and spaces
      return trimmed.replace(/[^a-zA-Z\s]/g, "").substring(0, 30);

    case "description":
      // For descriptions, allow more characters but strip HTML
      return trimmed
        .replace(/</g, "")
        .replace(/>/g, "")
        .replace(/&/g, "")
        .replace(/;/g, "")
        .substring(0, 1000);

    case "email":
      // For emails, basic email format preservation
      return trimmed.replace(/[^\w@.-]/g, "").substring(0, 100);

    case "url":
      // For URLs, allow URL-safe characters
      return trimmed
        .replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=]/g, "")
        .substring(0, 255);

    default:
      // Default XSS protection
      return trimmed
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }
};

module.exports = {
  createValidator,
  Validators,
  sanitizeString,
};
