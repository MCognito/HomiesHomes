/**
 * Tests for our validation middleware
 *
 * Makes sure our data validation works before data hits the database
 */

const { pool } = require("./setupTests");
const {
  validateProperty,
  validatePropertyUpdate,
  validatePropertySearch,
} = require("../controllers/validation");

// Simple mock of a Koa context for testing
const mockContext = (body = {}, query = {}) => ({
  request: {
    body,
    query,
  },
  state: {},
  status: 200,
  body: {},
  throw: jest.fn(),
});

const mockNext = jest.fn();

describe("Validation Middleware", () => {
  beforeEach(() => {
    mockNext.mockClear();
  });

  describe("validateProperty middleware", () => {
    test("should pass validation for valid property data", async () => {
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

      const ctx = mockContext(validProperty);

      await validateProperty(ctx, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(ctx.status).toBe(200);
    });

    test("should reject property with invalid title", async () => {
      const invalidProperty = {
        title: "H",
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

      const ctx = mockContext(invalidProperty);

      await validateProperty(ctx, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty("errors");
      expect(ctx.body).toHaveProperty("message", "Incorrect format fields");
    });

    test("should reject property with XSS attempt in description", async () => {
      const invalidProperty = {
        title: "Beautiful Family Home",
        description: 'A spacious home <script>alert("XSS")</script>',
        price: 350000,
        location: "Manchester, UK",
        bedrooms: 4,
        bathrooms: 2,
        property_type: "House",
        image_url: "house-image.jpg",
        agent_id: 1,
      };

      const ctx = mockContext(invalidProperty);

      await validateProperty(ctx, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty("errors");
      expect(ctx.body).toHaveProperty("message", "Incorrect format fields");
    });
  });

  describe("validatePropertyUpdate middleware", () => {
    test("should pass validation for valid property update", async () => {
      const validUpdate = {
        title: "Updated Home",
        price: 400000,
      };

      const ctx = mockContext(validUpdate);

      await validatePropertyUpdate(ctx, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(ctx.status).toBe(200);
    });

    test("should reject update with invalid price", async () => {
      const invalidUpdate = {
        price: -1000, // Negative prices
      };

      const ctx = mockContext(invalidUpdate);

      await validatePropertyUpdate(ctx, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty("errors");
      expect(ctx.body).toHaveProperty("message", "Incorrect format fields");
    });
  });

  describe("validatePropertySearch middleware", () => {
    test("should pass validation for valid search parameters", async () => {
      const validParams = {
        minPrice: 100000,
        maxPrice: 500000,
        minBedrooms: 3,
        property_type: "House",
      };

      const ctx = mockContext(validParams);

      await validatePropertySearch(ctx, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(ctx.status).toBe(200);
    });

    test("should reject invalid property type", async () => {
      // Made-up property type won't pass validation
      const invalidParams = {
        minPrice: 100000,
        maxPrice: 500000,
        property_type: "InvalidType",
      };

      const ctx = mockContext({});

      // Need to set the body directly for this test
      ctx.request.body = invalidParams;

      await validatePropertySearch(ctx, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty("errors");
      expect(ctx.body).toHaveProperty("message", "Incorrect format fields");
    });
  });
});
