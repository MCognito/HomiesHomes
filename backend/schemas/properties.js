/**
 * Validation schemas for properties
 */

const { Validators } = require("../middlewares/validation");

// Common property validation functions
const validateTitle = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const stringCheck = Validators.string(value);
  if (stringCheck !== true) return stringCheck;

  const maxLengthCheck = Validators.maxLength(100)(value);
  if (maxLengthCheck !== true) return maxLengthCheck;

  // Check for special characters and HTML entities
  if (/[<>&;]|&amp;|&lt;|&gt;/.test(value)) {
    return "Title cannot contain special characters like <, >, &, or ;";
  }

  // Only allow alphanumeric characters, spaces, and basic punctuation
  if (!/^[a-zA-Z0-9\s.,!?'"-]+$/.test(value)) {
    return "Title can only contain letters, numbers, spaces, and basic punctuation";
  }

  return true;
};

const validateDescription = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const stringCheck = Validators.string(value);
  if (stringCheck !== true) return stringCheck;

  const maxLengthCheck = Validators.maxLength(1000)(value);
  if (maxLengthCheck !== true) return maxLengthCheck;

  return true;
};

const validatePrice = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const numberCheck = Validators.number(value);
  if (numberCheck !== true) return numberCheck;

  const positiveCheck = Validators.positiveNumber(value);
  if (positiveCheck !== true) return positiveCheck;

  // Maximum price check
  const num = Number(value);
  if (num > 100000000) {
    return "Price is too high";
  }

  return true;
};

const validateLocation = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const stringCheck = Validators.string(value);
  if (stringCheck !== true) return stringCheck;

  const maxLengthCheck = Validators.maxLength(100)(value);
  if (maxLengthCheck !== true) return maxLengthCheck;

  return true;
};

const validateBedrooms = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const integerCheck = Validators.integer(value);
  if (integerCheck !== true) return integerCheck;

  const positiveCheck = Validators.positiveNumber(value);
  if (positiveCheck !== true) return positiveCheck;

  // Maximum bedrooms check
  const num = Number(value);
  if (num > 50) {
    return "Number of bedrooms is too high";
  }

  return true;
};

const validateBathrooms = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const integerCheck = Validators.integer(value);
  if (integerCheck !== true) return integerCheck;

  const positiveCheck = Validators.positiveNumber(value);
  if (positiveCheck !== true) return positiveCheck;

  // Maximum bathrooms check
  const num = Number(value);
  if (num > 50) {
    return "Number of bathrooms is too high";
  }

  return true;
};

const validatePropertyType = (value) => {
  const requiredCheck = Validators.required(value);
  if (requiredCheck !== true) return requiredCheck;

  const stringCheck = Validators.string(value);
  if (stringCheck !== true) return stringCheck;

  const validPropertyTypes = [
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
  const typeCheck = Validators.oneOf(validPropertyTypes)(value);
  if (typeCheck !== true) return typeCheck;

  return true;
};

// Schema for creating a new property
const createPropertySchema = {
  title: validateTitle,
  description: validateDescription,
  price: validatePrice,
  location: validateLocation,
  bedrooms: validateBedrooms,
  bathrooms: validateBathrooms,
  property_type: validatePropertyType,
  image_url: (value) => {
    // Image URL is optional, defaulting to 'prop1.jpg'
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    return true;
  },
};

// Schema for updating a property (same as create schema)
const updatePropertySchema = createPropertySchema;

module.exports = {
  createPropertySchema,
  updatePropertySchema,
};
