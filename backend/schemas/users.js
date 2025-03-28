/**
 * Validation schemas for users
 */

const { Validators } = require("../middlewares/validation");

// Schema for user registration
const registerSchema = {
  username: (value) => {
    // Chain validators
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    const minLengthCheck = Validators.minLength(3)(value);
    if (minLengthCheck !== true) return minLengthCheck;

    const maxLengthCheck = Validators.maxLength(30)(value);
    if (maxLengthCheck !== true) return maxLengthCheck;

    // Username format check
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }

    return true;
  },

  password: (value) => {
    // Chain validators
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    const minLengthCheck = Validators.minLength(6)(value);
    if (minLengthCheck !== true) return minLengthCheck;

    const maxLengthCheck = Validators.maxLength(100)(value);
    if (maxLengthCheck !== true) return maxLengthCheck;

    // Password strength checks
    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number";
    }

    return true;
  },

  user_email: (value) => {
    // Chain validators
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    const emailCheck = Validators.email(value);
    if (emailCheck !== true) return emailCheck;

    const maxLengthCheck = Validators.maxLength(100)(value);
    if (maxLengthCheck !== true) return maxLengthCheck;

    return true;
  },

  user_phone: (value) => {
    // Phone is optional
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    // Phone format check
    if (!/^[0-9+\-\s()]*$/.test(value)) {
      return "Phone number can only contain digits, spaces, and +()-";
    }

    const maxLengthCheck = Validators.maxLength(20)(value);
    if (maxLengthCheck !== true) return maxLengthCheck;

    return true;
  },

  user_firstName: (value) => {
    // First name is optional
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    const maxLengthCheck = Validators.maxLength(50)(value);
    if (maxLengthCheck !== true) return maxLengthCheck;

    return true;
  },

  user_lastName: (value) => {
    // Last name is optional
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    const maxLengthCheck = Validators.maxLength(50)(value);
    if (maxLengthCheck !== true) return maxLengthCheck;

    return true;
  },
};

// Schema for login
const loginSchema = {
  username: (value) => {
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    return true;
  },

  password: (value) => {
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const stringCheck = Validators.string(value);
    if (stringCheck !== true) return stringCheck;

    return true;
  },
};

// Schema for updating user role
const updateRoleSchema = {
  user_levels: (value) => {
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const integerCheck = Validators.integer(value);
    if (integerCheck !== true) return integerCheck;

    // Check valid role levels (0-2)
    const num = Number(value);
    if (num < 0 || num > 2) {
      return "Role level must be between 0 and 2";
    }

    return true;
  },
};

module.exports = {
  registerSchema,
  loginSchema,
  updateRoleSchema,
};
