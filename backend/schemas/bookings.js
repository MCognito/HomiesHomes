/**
 * Validation schemas for bookings
 */

const { Validators } = require("../middlewares/validation");

// Schema for creating a new booking
const createBookingSchema = {
  property_id: (value) => {
    // Chain validators
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const integerCheck = Validators.integer(value);
    if (integerCheck !== true) return integerCheck;

    const positiveCheck = Validators.positiveNumber(value);
    if (positiveCheck !== true) return positiveCheck;

    return true;
  },

  scheduled_date: (value) => {
    // Chain validators
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const dateCheck = Validators.futureDate(value);
    if (dateCheck !== true) return dateCheck;

    return true;
  },

  scheduled_time: (value) => {
    // Chain validators
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const timeCheck = Validators.timeFormat(value);
    if (timeCheck !== true) return timeCheck;

    return true;
  },
};

// Schema for updating a booking
const updateBookingSchema = {
  scheduled_date: (value) => {
    // For update, date is optional
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const dateCheck = Validators.futureDate(value);
    if (dateCheck !== true) return dateCheck;

    return true;
  },

  scheduled_time: (value) => {
    // For update, time is optional
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const timeCheck = Validators.timeFormat(value);
    if (timeCheck !== true) return timeCheck;

    return true;
  },

  booking_status: (value, data) => {
    // For update, status is optional
    if (value === undefined || value === null || value === "") {
      return true;
    }

    const validStatusValues = ["pending", "confirmed", "cancelled", "attended"];
    const statusCheck = Validators.oneOf(validStatusValues)(value);
    if (statusCheck !== true) return statusCheck;

    return true;
  },
};

// Schema for updating a booking status
const updateStatusSchema = {
  status: (value) => {
    // Status is required
    const requiredCheck = Validators.required(value);
    if (requiredCheck !== true) return requiredCheck;

    const validStatusValues = ["pending", "confirmed", "cancelled", "attended"];
    const statusCheck = Validators.oneOf(validStatusValues)(value);
    if (statusCheck !== true) return statusCheck;

    return true;
  },
};

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  updateStatusSchema,
};
