/**
 * Testing our property validation schema
 *
 * Makes sure our property JSON schema catches bad data before it hits the API
 */

const { Validator } = require("jsonschema");
const propertySchema = require("../schemas/property-schema.json").definitions
  .property;

// Setting up the validator
const validator = new Validator();

describe("Property Schema Validation", () => {
  // Example of a valid property
  const validProperty = {
    title: "Beautiful Family Home",
    description:
      "A spacious and modern family home with a large garden and excellent views.",
    price: 350000,
    location: "Manchester, UK",
    bedrooms: 4,
    bathrooms: 2,
    property_type: "House",
    image_url: "house-image.jpg",
    agent_id: 1,
  };

  test("Valid property passes validation", () => {
    const result = validator.validate(validProperty, propertySchema);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  // Checking title rules
  describe("Title validation", () => {
    test("Title cannot be empty", () => {
      const property = { ...validProperty, title: "" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Title must be at least 5 characters", () => {
      const property = { ...validProperty, title: "Home" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Title can contain apostrophes and periods", () => {
      const property = { ...validProperty, title: "John's St. James House" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(true);
    });

    test("Title cannot contain invalid characters", () => {
      const property = {
        ...validProperty,
        title: 'House with <script>alert("XSS")</script>',
      };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });
  });

  // Making sure descriptions are properly validated
  describe("Description validation", () => {
    test("Description cannot be empty", () => {
      const property = { ...validProperty, description: "" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Description must be at least 20 characters", () => {
      const property = { ...validProperty, description: "Too short desc" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Description can contain currency symbols", () => {
      const property = {
        ...validProperty,
        description: "This property costs £350,000 ($450,000 or €400,000)",
      };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(true);
    });
  });

  // Checking price validation rules
  describe("Price validation", () => {
    test("Price cannot be negative", () => {
      const property = { ...validProperty, price: -100 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Price cannot be zero", () => {
      const property = { ...validProperty, price: 0 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Price can be a decimal", () => {
      const property = { ...validProperty, price: 350000.5 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(true);
    });
  });

  // Validating location format
  describe("Location validation", () => {
    test("Location cannot be empty", () => {
      const property = { ...validProperty, location: "" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Location can contain apostrophes and commas", () => {
      const property = {
        ...validProperty,
        location: "John's Avenue, Manchester",
      };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(true);
    });

    test("Location cannot contain invalid characters", () => {
      const property = {
        ...validProperty,
        location: 'Manchester <script>alert("XSS")</script>',
      };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });
  });

  // Bedroom count validation
  describe("Bedrooms validation", () => {
    test("Bedrooms cannot be negative", () => {
      const property = { ...validProperty, bedrooms: -1 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Bedrooms cannot be zero", () => {
      const property = { ...validProperty, bedrooms: 0 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Bedrooms must be a whole number", () => {
      const property = { ...validProperty, bedrooms: 2.5 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });
  });

  // Bathroom count validation
  describe("Bathrooms validation", () => {
    test("Bathrooms cannot be negative", () => {
      const property = { ...validProperty, bathrooms: -1 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Bathrooms cannot be zero", () => {
      const property = { ...validProperty, bathrooms: 0 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Bathrooms must be a whole number", () => {
      const property = { ...validProperty, bathrooms: 1.5 };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });
  });

  // Property type validation against allowed values
  describe("Property type validation", () => {
    test("Property type must be from the allowed list", () => {
      const property = { ...validProperty, property_type: "InvalidType" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Property type accepts valid values", () => {
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
        const property = { ...validProperty, property_type: type };
        const result = validator.validate(property, propertySchema);
        expect(result.valid).toBe(true);
      });
    });
  });

  // Image URL validation tests
  describe("Image URL validation", () => {
    test("Image URL can be a simple jpg filename", () => {
      const property = { ...validProperty, image_url: "property.jpg" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(true);
    });

    test("Image URL can be a URL with a valid image extension", () => {
      const property = {
        ...validProperty,
        image_url: "https://example.com/images/property.png",
      };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(true);
    });

    test("Image URL must have a valid extension", () => {
      const property = { ...validProperty, image_url: "property.pdf" };
      const result = validator.validate(property, propertySchema);
      expect(result.valid).toBe(false);
    });

    test("Image URL can have various valid extensions", () => {
      const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

      validExtensions.forEach((ext) => {
        const property = { ...validProperty, image_url: `property.${ext}` };
        const result = validator.validate(property, propertySchema);
        expect(result.valid).toBe(true);
      });
    });
  });
});
