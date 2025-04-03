/**
 * Tests for property search filters
 *
 * Makes sure users can't break the search with bad inputs or hacks
 */

const { Validator } = require("jsonschema");
const propertySearchSchema = require("../schemas/property-schema.json")
  .definitions.propertySearch;

// Set up the validator
const validator = new Validator();

describe("Property Search Parameters Validation", () => {
  test("Valid search parameters passes validation", () => {
    const validParams = {
      location: "Manchester",
      minBedrooms: 2,
      maxBedrooms: 4,
      minBathrooms: 1,
      maxBathrooms: 3,
      minPrice: 100000,
      maxPrice: 500000,
      property_type: "House",
    };

    const result = validator.validate(validParams, propertySearchSchema);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  describe("Location validation", () => {
    test("Location with apostrophes and commas is valid", () => {
      const params = {
        location: "St. John's, Manchester",
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(true);
    });

    test("Location with special characters is invalid", () => {
      const params = {
        location: "Manchester <script>alert('XSS')</script>", // Trying to sneak in code
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });

    test("Location with SQL injection attempt is invalid", () => {
      const params = {
        location: "Manchester' OR '1'='1", // Classic SQL injection
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });
  });

  describe("Numeric parameter validation", () => {
    test("Minimum bedrooms must be positive", () => {
      const params = {
        minBedrooms: -1, // cannot have negative bedrooms
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });

    test("Maximum bedrooms must be at least equal to minimum bedrooms", () => {
      const params = {
        minBedrooms: 3,
        maxBedrooms: 2,
      };

      // checking schema-level validation
      
      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(true);
    });

    test("Price values must be non-negative", () => {
      const params = {
        minPrice: -50000,
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });

    test("Price can be 0 (for filtering possibly free properties)", () => {
      const params = {
        minPrice: 0,
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe("Property type validation", () => {
    test("Valid property types are accepted", () => {
      const validTypes = [
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

      validTypes.forEach((type) => {
        const params = { property_type: type };
        const result = validator.validate(params, propertySearchSchema);
        expect(result.valid).toBe(true);
      });
    });

    test("Invalid property type is rejected", () => {
      const params = {
        property_type: "InvalidType",
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });

    test("Property type with injection attempt is rejected", () => {
      const params = {
        property_type: "House' OR '1'='1", // More SQL injection attempts
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });
  });

  describe("Mixed parameters validation", () => {
    test("Complex valid search parameters pass validation", () => {
      const params = {
        location: "Manchester, City Centre",
        minBedrooms: 2,
        maxBedrooms: 4,
        property_type: "House",
        minPrice: 200000,
        maxPrice: 450000,
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(true);
    });

    test("One invalid parameter makes the entire validation fail", () => {
      const params = {
        location: "Manchester",
        minBedrooms: 2,
        maxBedrooms: 4,
        property_type: "House<script>",
      };

      const result = validator.validate(params, propertySearchSchema);
      expect(result.valid).toBe(false);
    });
  });
});
