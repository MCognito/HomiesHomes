/**
 * Data validation using JSON Schema
 */

const { Validator, ValidationError } = require("jsonschema");

// Grab all the schema definitions
const propertySchema = require("../schemas/property-schema.json").definitions
  .property;
const propertyUpdateSchema = require("../schemas/property-schema.json")
  .definitions.propertyUpdate;
const propertySearchSchema = require("../schemas/property-schema.json")
  .definitions.propertySearch;

const bookingSchema = require("../schemas/booking-schema.json").definitions
  .booking;
const bookingUpdateSchema = require("../schemas/booking-schema.json")
  .definitions.bookingUpdate;
const bookingStatusUpdateSchema = require("../schemas/booking-schema.json")
  .definitions.bookingStatusUpdate;

const userSchema = require("../schemas/user-schema.json").definitions.user;
const loginSchema = require("../schemas/user-schema.json").definitions.login;
const userUpdateSchema = require("../schemas/user-schema.json").definitions
  .userUpdate;

// Additional schemas for agent requests and favorites
const agentRequestSchema = require("../schemas/agent-request-schema.json")
  .definitions.agentRequest;
const agentRequestStatusSchema = require("../schemas/agent-request-schema.json")
  .definitions.agentRequestStatus;
const favouriteSchema = require("../schemas/favourites-schema.json").definitions
  .favourite;

/**
 * Creates middleware that validates data against a schema
 */
const makeKoaValidator = (schema, resource) => {
  const v = new Validator();
  const validationOptions = {
    throwError: true,
    propertyName: resource,
  };

  const handler = async (ctx, next) => {
    const body = ctx.request.body;

    // Extra logging for property validation
    if (resource === "property") {
      console.log(`Validating ${resource} data:`, JSON.stringify(body));
    }

    try {
      v.validate(body, schema, validationOptions);

      // Log when validation passes
      if (resource === "property") {
        console.log(`${resource} validation successful`);
      }

      // Special handling for booking date/time validation
      if (
        resource === "booking" &&
        (body.scheduled_date || body.scheduled_time)
      ) {
        const errors = {};

        // Check if booking date is in the future
        if (body.scheduled_date) {
          const bookingDate = new Date(body.scheduled_date);
          bookingDate.setHours(0, 0, 0, 0); // Start of day

          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of day

          if (bookingDate < today) {
            errors.scheduled_date =
              "Booking date must be today or in the future";
          }
        }

        // Check if booking time is during business hours
        if (body.scheduled_time) {
          const [hours, minutes] = body.scheduled_time.split(":").map(Number);

          if (hours < 9 || (hours === 17 && minutes > 0) || hours > 17) {
            errors.scheduled_time =
              "Booking time must be during business hours (9:00 AM to 5:00 PM)";
          }
        }

        // Return validation errors if found
        if (Object.keys(errors).length > 0) {
          ctx.status = 400;
          ctx.body = {
            message: "Invalid booking details",
            errors: errors,
          };
          return;
        }
      }

      await next();
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error(`Validation error for ${resource}:`, error);
        ctx.status = 400;

        // Format errors for easier frontend handling
        const formattedErrors = {};
        error.instance = error.instance || {};

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            // Clean up the property path
            const path = err.property.replace(`${resource}.`, "");
            formattedErrors[path] = err.message;
          });
        } else {
          formattedErrors._error = error.message;
        }

        ctx.body = {
          message: "Incorrect format fields",
          errors: formattedErrors,
        };
      } else {
        console.error(`Unexpected error in ${resource} validation:`, error);
        throw error;
      }
    }
  };

  return handler;
};

// Property validators
exports.validateProperty = makeKoaValidator(propertySchema, "property");
exports.validatePropertyUpdate = makeKoaValidator(
  propertyUpdateSchema,
  "property"
);
exports.validatePropertySearch = makeKoaValidator(
  propertySearchSchema,
  "propertySearch"
);

// Booking validators
exports.validateBooking = makeKoaValidator(bookingSchema, "booking");
exports.validateBookingUpdate = makeKoaValidator(
  bookingUpdateSchema,
  "booking"
);
exports.validateBookingStatusUpdate = makeKoaValidator(
  bookingStatusUpdateSchema,
  "booking"
);

// User validators
exports.validateUser = makeKoaValidator(userSchema, "user");
exports.validateLogin = makeKoaValidator(loginSchema, "login");
exports.validateUserUpdate = makeKoaValidator(userUpdateSchema, "user");

// Agent request validators
exports.validateAgentRequest = makeKoaValidator(
  agentRequestSchema,
  "agentRequest"
);
exports.validateAgentRequestStatus = makeKoaValidator(
  agentRequestStatusSchema,
  "agentRequestStatus"
);

// Favourites validators
exports.validateFavourite = makeKoaValidator(favouriteSchema, "favourite");

/**
 * Cleans strings to prevent XSS attacks
 */
exports.sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
