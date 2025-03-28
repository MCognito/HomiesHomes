/**
 * A module to run JSON Schema based validation on request/response data.
 * @module controllers/validation
 * @see schemas/* for JSON Schema definition files
 */

const { Validator, ValidationError } = require("jsonschema");

// Load schema definitions
const propertySchema = require("../schemas/property.json").definitions.property;
const propertyUpdateSchema = require("../schemas/property.json").definitions
  .propertyUpdate;

const bookingSchema = require("../schemas/booking.json").definitions.booking;
const bookingUpdateSchema = require("../schemas/booking.json").definitions
  .bookingUpdate;
const bookingStatusUpdateSchema = require("../schemas/booking.json").definitions
  .bookingStatusUpdate;

const userSchema = require("../schemas/user.json").definitions.user;
const loginSchema = require("../schemas/user.json").definitions.login;
const roleUpdateSchema = require("../schemas/user.json").definitions.roleUpdate;

/**
 * Wrapper that returns a Koa middleware validator for a given schema.
 * @param {object} schema - The JSON schema definition of the resource
 * @param {string} resource - The name of the resource e.g. 'property'
 * @returns {function} - A Koa middleware handler taking (ctx, next) params
 */
const makeKoaValidator = (schema, resource) => {
  const v = new Validator();
  const validationOptions = {
    throwError: true,
    propertyName: resource,
  };

  /**
   * Koa middleware handler function to do validation
   * @param {object} ctx - The Koa request/response context object
   * @param {function} next - The Koa next callback
   * @throws {ValidationError} a jsonschema library exception
   */
  const handler = async (ctx, next) => {
    const body = ctx.request.body;

    try {
      v.validate(body, schema, validationOptions);
      await next();
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error("Validation error:", error);
        ctx.status = 400;

        // Format the error response
        const formattedErrors = {};
        error.instance = error.instance || {};

        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            // Extract the property path
            const path = err.property.replace(`${resource}.`, "");
            formattedErrors[path] = err.message;
          });
        } else {
          formattedErrors._error = error.message;
        }

        ctx.body = {
          message: "Validation failed",
          errors: formattedErrors,
        };
      } else {
        // If it's not a validation error, pass it up
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
exports.validateRoleUpdate = makeKoaValidator(roleUpdateSchema, "role");

/**
 * Sanitize a string for database usage and XSS prevention
 * @param {String} str - The string to sanitize
 * @returns {String} - Sanitized string
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
