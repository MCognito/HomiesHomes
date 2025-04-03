const Router = require("koa-router");
const koaBody = require("koa-body");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const { authMiddleware, requireRole } = require("../middlewares/auth");
const { sanitizeString } = require("../middlewares/validation");
const {
  validateProperty,
  validatePropertyUpdate,
  validatePropertySearch,
} = require("../controllers/validation");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const router = new Router({ prefix: "/properties" });

const optionalAuth = async (ctx, next) => {
  const authHeader = ctx.headers["authorization"];
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, jwtSecret);

      // Set user info in state
      ctx.state.user = decoded;
      console.log(
        `Optional auth: User ${decoded.username} authenticated for ${ctx.path}`
      );
    } catch (err) {
      console.log(
        `Optional auth: Token invalid but continuing as public - ${err.message}`
      );
    }
  } else {
    console.log(
      `Optional auth: No token for ${ctx.path}, continuing as public`
    );
  }

  await next();
};

// Helper function to set CORS headers dynamically
const setCorsHeaders = (ctx) => {
  const origin = ctx.request.headers.origin;
  const allowedOrigins = [
    "https://gammacairo-deltareward-9000.codio-box.uk",
    "https://gammacairo-deltareward-3000.codio-box.uk",
  ];

  if (allowedOrigins.includes(origin)) {
    ctx.set("Access-Control-Allow-Origin", origin);
  } else {
    ctx.set(
      "Access-Control-Allow-Origin",
      "https://gammacairo-deltareward-3000.codio-box.uk"
    );
  }
  ctx.set("Access-Control-Allow-Credentials", "true");
};

// Handle OPTIONS request for CORS preflight on collection routes
router.options("/", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log(
    "Properties collection OPTIONS request handled with CORS headers"
  );
});

// Handle OPTIONS request for CORS preflight on individual property routes
router.options("/:id", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log(
    `Property ${ctx.params.id} OPTIONS request handled with CORS headers`
  );
});

// Handle OPTIONS request for CORS preflight on property filter routes
router.options("/filter", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log("Property filter OPTIONS request handled with CORS headers");
});

// Validate search query parameters
const validateSearchParams = async (ctx, next) => {
  // Extract search parameters from query
  const searchParams = {
    location: ctx.query.location,
    minBedrooms: ctx.query.minBedrooms,
    maxBedrooms: ctx.query.maxBedrooms,
    minBathrooms: ctx.query.minBathrooms,
    maxBathrooms: ctx.query.maxBathrooms,
    minPrice: ctx.query.minPrice,
    maxPrice: ctx.query.maxPrice,
    property_type: ctx.query.property_type,
  };

  // Filter out undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(searchParams).filter(([_, v]) => v !== undefined)
  );

  // If there are search parameters, validate them
  if (Object.keys(filteredParams).length > 0) {
    try {
      // Set up validator with the property search schema
      ctx.request.body = filteredParams; // Temporarily store in body for validation
      await validatePropertySearch(ctx, async () => {
        // Validation passed, restore the actual body and continue
        ctx.request.body = ctx.request.originalBody || {};
        await next();
      });
    } catch (error) {
      // Let the validation middleware handle errors
      console.error("Search validation error:", error);
      ctx.status = 400;
      ctx.body = {
        message: "Invalid search parameters",
        error: error.message,
      };
    }
  } else {
    // No search parameters to validate
    await next();
  }
};

// GET: All properties (Public access with enhanced authentication if token present)
router.get("/", optionalAuth, validateSearchParams, async (ctx) => {
  // Set CORS headers for the response
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Expose-Headers", "Authorization, Link");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );

  console.log("Properties GET request received:", ctx.query);

  // Authentication check is now handled by optionalAuth middleware
  // directly use ctx.state.user if available
  if (ctx.state.user) {
    console.log(
      `User ${ctx.state.user.username} authenticated for properties list`
    );
  } else {
    console.log("No authenticated user for properties list - public access");
  }

  const {
    location,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    propertyType,
    minPrice,
    maxPrice,
    keyword,
    listingType,
    limit,
    sortBy,
    sortOrder,
    agent_id,
  } = ctx.query;

  // Update the query to join with the users table to get agent details
  let query = `
    SELECT p.*, 
           u.username AS agent_username, 
           u.user_email AS agent_email, 
           u.user_phone AS agent_phone,
           u.user_firstName AS agent_firstName,
           u.user_lastName AS agent_lastName
    FROM properties p
    LEFT JOIN users u ON p.agent_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  // Add explicit filter for agent_id if provided
  if (agent_id) {
    query += " AND p.agent_id = ?";
    params.push(agent_id);
    console.log(`Filtering properties for agent ID: ${agent_id}`);
  }

  if (location) {
    query += " AND p.location LIKE ?";
    params.push(`%${location}%`);
  }

  // Handle min/max bedroom filters
  if (minBedrooms) {
    query += " AND p.bedrooms >= ?";
    params.push(minBedrooms);
  }

  if (maxBedrooms) {
    query += " AND p.bedrooms <= ?";
    params.push(maxBedrooms);
  }

  // Maintain backward compatibility with old single bedroom parameter
  if (ctx.query.bedrooms && !minBedrooms && !maxBedrooms) {
    query += " AND p.bedrooms >= ?";
    params.push(ctx.query.bedrooms);
  }

  // Handle min/max bathroom filters
  if (minBathrooms) {
    query += " AND p.bathrooms >= ?";
    params.push(minBathrooms);
  }

  if (maxBathrooms) {
    query += " AND p.bathrooms <= ?";
    params.push(maxBathrooms);
  }

  // Maintain backward compatibility with old single bathroom parameter
  if (ctx.query.bathrooms && !minBathrooms && !maxBathrooms) {
    query += " AND p.bathrooms >= ?";
    params.push(ctx.query.bathrooms);
  }

  if (propertyType) {
    query += " AND p.property_type = ?";
    params.push(propertyType);
  }

  if (minPrice) {
    query += " AND p.price >= ?";
    params.push(minPrice);
  }

  if (maxPrice) {
    query += " AND p.price <= ?";
    params.push(maxPrice);
  }

  if (keyword) {
    query += " AND (p.title LIKE ? OR p.description LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (listingType && listingType !== "all") {
    query += " AND (p.property_type LIKE ?)";
    params.push(`%${listingType}%`);
  }

  // Add sorting if provided
  if (sortBy) {
    const validColumns = [
      "price",
      "bedrooms",
      "bathrooms",
      "title",
      "location",
    ];
    const validOrders = ["ASC", "DESC"];

    // Sanitise inputs to prevent SQL injection
    const column = validColumns.includes(sortBy) ? sortBy : "id";
    const order = validOrders.includes(sortOrder?.toUpperCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    query += ` ORDER BY p.${column} ${order}`;
  } else {
    // Default sort by newest (id DESC)
    query += " ORDER BY p.id DESC";
  }

  // Add limit if specified
  if (limit && !isNaN(parseInt(limit))) {
    query += " LIMIT ?";
    params.push(parseInt(limit));
  }

  try {
    console.log("Executing SQL query:", query);
    console.log("With parameters:", params);

    const [properties] = await pool.query(query, params);

    console.log(
      `Query returned ${properties.length} properties:`,
      properties.map((p) => `ID: ${p.id}, Title: ${p.title}`).slice(0, 5)
    );

    // Get user role from state
    const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;

    // Set appropriate role-based headers
    if (userLevel >= 1) {
      ctx.set("X-Agent-Access", "true");
    }
    if (userLevel >= 2) {
      ctx.set("X-Admin-Access", "true");
    }

    // Map properties with links
    const propertiesWithLinks = properties.map((p) => {
      // Base links for all users
      const links = {
        self: { href: `/properties/${p.id}`, method: "GET" },
      };

      // Add agent/admin specific links
      if (userLevel >= 1) {
        links.update = { href: `/properties/${p.id}`, method: "PUT" };

        // Check if the agent is the owner or user is admin
        if (
          ctx.state.user &&
          (ctx.state.user.user_id === p.agent_id || userLevel >= 2)
        ) {
          links.delete = { href: `/properties/${p.id}`, method: "DELETE" };
        }
      }

      // Add links for authenticated users
      if (userLevel >= 0) {
        links.book = {
          href: `/bookings`,
          method: "POST",
          description: "Book a viewing",
        };
        links.favorite = {
          href: `/favourites/${p.id}`,
          method: "POST",
          description: "Add to favorites",
        };
      }

      return {
        ...p,
        _links: links,
        agent: {
          id: p.agent_id,
          username: p.agent_username,
          email: p.agent_email,
          phone: p.agent_phone,
          firstName: p.agent_firstName,
          lastName: p.agent_lastName,
        },
      };
    });

    // Collection-level links
    const collectionLinks = {
      self: { href: "/properties", method: "GET" },
    };

    // Add agent-specific collection links
    if (userLevel >= 1) {
      collectionLinks.create = {
        href: "/properties",
        method: "POST",
        description: "Create new property",
      };
    }

    ctx.body = {
      data: propertiesWithLinks,
      _links: collectionLinks,
      count: properties.length,
    };
  } catch (err) {
    console.error("Error fetching filtered properties:", err);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

// GET: Property by ID (Public)
router.get("/:id", optionalAuth, async (ctx) => {
  // Set CORS headers for the response
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Credentials", "true");

  console.log(`Property GET request received for ID: ${ctx.params.id}`);

  // User authentication state is already set by the optionalAuth middleware
  if (ctx.state.user) {
    console.log(
      `User ${ctx.state.user.username} authenticated for property ${ctx.params.id}`
    );
  } else {
    console.log(
      `No authenticated user for property ${ctx.params.id} - public access`
    );
  }

  const { id } = ctx.params;
  try {
    // Update the query to join with users table for agent details
    const [rows] = await pool.query(
      `
      SELECT p.*, 
             u.username AS agent_username, 
             u.user_email AS agent_email, 
             u.user_phone AS agent_phone,
             u.user_firstName AS agent_firstName,
             u.user_lastName AS agent_lastName
      FROM properties p
      LEFT JOIN users u ON p.agent_id = u.user_id
      WHERE p.id = ?
    `,
      [id]
    );

    if (!rows.length) {
      ctx.status = 404;
      ctx.body = { error: "Property not found" };
      return;
    }

    const property = rows[0];

    // Get user role from state
    const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;

    // Base links available to all users
    const links = {
      self: { href: `/properties/${property.id}`, method: "GET" },
    };

    // Add agent/admin specific links
    if (userLevel >= 1) {
      links.update = {
        href: `/properties/${property.id}`,
        method: "PUT",
      };

      // Check if the agent is the owner of this property
      if (
        ctx.state.user &&
        (ctx.state.user.user_id === property.agent_id || userLevel >= 2)
      ) {
        links.delete = {
          href: `/properties/${property.id}`,
          method: "DELETE",
        };
      }
    }

    // Add booking link for authenticated users
    if (userLevel >= 0) {
      links.book = {
        href: `/bookings`,
        method: "POST",
        description: "Book a viewing",
      };
      links.favorite = {
        href: `/favourites/${property.id}`,
        method: "POST",
        description: "Add to favorites",
      };
    }

    // Set appropriate role-based headers
    if (userLevel >= 1) {
      ctx.set("X-Agent-Access", "true");
    }
    if (userLevel >= 2) {
      ctx.set("X-Admin-Access", "true");
    }

    // Add the agent information to the property data
    const propertyWithAgent = {
      ...property,
      agent: {
        id: property.agent_id,
        username: property.agent_username,
        email: property.agent_email,
        phone: property.agent_phone,
        firstName: property.agent_firstName,
        lastName: property.agent_lastName,
      },
    };

    ctx.body = {
      data: propertyWithAgent,
      _links: links,
    };
  } catch (err) {
    console.error(`Error fetching property ${id}:`, err);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

// POST: Create property (Agents only)
router.post("/", authMiddleware, validateProperty, async (ctx) => {
  // Set CORS headers
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    // Check if user is an agent or admin (user_levels 'agent' or 'admin')
    const userLevel = ctx.state.user.user_levels;
    let userLevelNum = 0;

    if (typeof userLevel === "string") {
      if (userLevel === "agent") userLevelNum = 1;
      if (userLevel === "admin") userLevelNum = 2;
    } else {
      userLevelNum = userLevel;
    }

    if (userLevelNum < 1) {
      ctx.status = 403;
      ctx.body = { error: "Only agents can create properties" };
      return;
    }

    const {
      title,
      description,
      price,
      location,
      bedrooms,
      bathrooms,
      property_type,
      image_url,
    } = ctx.request.body;

    // Sanitise inputs (basic XSS protection)
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedLocation = sanitizeString(location);

    // Capitalise the first letter of property_type for consistency
    let sanitizedPropertyType = sanitizeString(property_type);
    if (sanitizedPropertyType) {
      // Capitalise first letter (e.g. "apartment" -> "Apartment")
      sanitizedPropertyType =
        sanitizedPropertyType.charAt(0).toUpperCase() +
        sanitizedPropertyType.slice(1).toLowerCase();

      // Check if it's a valid property type after capitalization
      const validPropertyTypes = [
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

      // Default to "House" if not valid
      if (!validPropertyTypes.includes(sanitizedPropertyType)) {
        sanitizedPropertyType = "House";
      }
    } else {
      sanitizedPropertyType = "House";
    }

    const sanitizedImageUrl = sanitizeString(image_url || "prop1.jpg");

    // Convert numeric values
    const sanitizedPrice = parseFloat(price);
    const sanitizedBedrooms = parseInt(bedrooms, 10);
    const sanitizedBathrooms = parseInt(bathrooms, 10);

    const agent_id = ctx.state.user.user_id;

    // Use parameterised query to prevent SQL injection
    const [result] = await pool.query(
      "INSERT INTO properties (title, description, price, location, bedrooms, bathrooms, property_type, image_url, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        sanitizedTitle,
        sanitizedDescription,
        sanitizedPrice,
        sanitizedLocation,
        sanitizedBedrooms,
        sanitizedBathrooms,
        sanitizedPropertyType,
        sanitizedImageUrl,
        agent_id,
      ]
    );

    // Create HATEOAS response
    const links = {
      self: { href: `/properties/${result.insertId}`, method: "GET" },
      update: { href: `/properties/${result.insertId}`, method: "PUT" },
      delete: { href: `/properties/${result.insertId}`, method: "DELETE" },
    };

    ctx.status = 201;
    ctx.body = {
      message: "Property created successfully",
      property_id: result.insertId,
      _links: links,
    };
  } catch (error) {
    console.error("Error creating property:", error);
    ctx.status = 500;
    ctx.body = {
      message: "Failed to create property",
      error: error.message,
    };
  }
});

// PUT: Update property (Agents only)
router.put("/:id", authMiddleware, validatePropertyUpdate, async (ctx) => {
  // Set CORS headers
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    console.log(`Property update request received for ID: ${ctx.params.id}`);
    console.log(`Request body: ${JSON.stringify(ctx.request.body)}`);

    const { id } = ctx.params;
    const userId = ctx.state.user.user_id;
    const userLevel = ctx.state.user.user_levels;

    // Convert user_levels to numeric if it's a string
    let userLevelNum = 0;
    if (typeof userLevel === "string") {
      if (userLevel === "agent") userLevelNum = 1;
      if (userLevel === "admin") userLevelNum = 2;
    } else {
      userLevelNum = userLevel;
    }

    // Check if user is an agent or admin
    if (userLevelNum < 1) {
      ctx.status = 403;
      ctx.body = { error: "Only agents can update properties" };
      return;
    }

    // First, check if the property exists and get the current agent_id
    const [propertyResult] = await pool.query(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );

    if (propertyResult.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "Property not found" };
      return;
    }

    // Check if the agent owns this property or is an admin
    if (propertyResult[0].agent_id !== userId && userLevelNum < 2) {
      ctx.status = 403;
      ctx.body = { error: "You can only update your own properties" };
      return;
    }

    // Extract fields from request body
    const {
      title,
      description,
      price,
      location,
      bedrooms,
      bathrooms,
      property_type,
      image_url,
    } = ctx.request.body;

    // Sanitise inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedLocation = sanitizeString(location);
    const sanitizedPropertyType = sanitizeString(property_type);
    const sanitizedImageUrl = sanitizeString(image_url);

    // Convert numeric values
    const sanitizedPrice = parseFloat(price);
    const sanitizedBedrooms = parseInt(bedrooms, 10);
    const sanitizedBathrooms = parseInt(bathrooms, 10);

    // Update the property
    await pool.query(
      "UPDATE properties SET title = ?, description = ?, price = ?, location = ?, bedrooms = ?, bathrooms = ?, property_type = ?, image_url = ? WHERE id = ?",
      [
        sanitizedTitle,
        sanitizedDescription,
        sanitizedPrice,
        sanitizedLocation,
        sanitizedBedrooms,
        sanitizedBathrooms,
        sanitizedPropertyType,
        sanitizedImageUrl,
        id,
      ]
    );

    // Get the updated property
    const [updatedProperty] = await pool.query(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );

    // Create response with updated property data
    const property = updatedProperty[0];

    // Create HATEOAS links
    const links = {
      self: { href: `/properties/${property.id}`, method: "GET" },
      update: { href: `/properties/${property.id}`, method: "PUT" },
      delete: { href: `/properties/${property.id}`, method: "DELETE" },
    };

    ctx.status = 200;
    ctx.body = {
      ...property,
      _links: links,
    };
  } catch (err) {
    console.error("Error updating property:", err);
    ctx.status = 500;
    ctx.body = {
      error: err.message || "Failed to update property",
    };
  }
});

// DELETE: Property (Agents only)
router.delete("/:id", authMiddleware, async (ctx) => {
  const { id } = ctx.params;

  try {
    // Convert user_levels to numeric if it's a string
    const userLevel = ctx.state.user.user_levels;
    let userLevelNum = 0;

    if (typeof userLevel === "string") {
      if (userLevel === "agent") userLevelNum = 1;
      if (userLevel === "admin") userLevelNum = 2;
    } else {
      userLevelNum = userLevel;
    }

    // Check if user is an agent or admin
    if (userLevelNum < 1) {
      ctx.status = 403;
      ctx.body = { error: "Only agents can delete properties" };
      return;
    }

    // First check if the property exists and if the user has permission to delete it
    const [propertyResult] = await pool.query(
      "SELECT * FROM properties WHERE id = ?",
      [id]
    );

    if (propertyResult.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "Property not found" };
      return;
    }

    // Check if the agent owns this property or is an admin
    if (
      propertyResult[0].agent_id !== ctx.state.user.user_id &&
      userLevelNum < 2
    ) {
      ctx.status = 403;
      ctx.body = { error: "You can only delete your own properties" };
      return;
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Since we have ON DELETE CASCADE in the database schema,
      // bookings and favorites will be automatically deleted
      // when the property is deleted

      // But to be safe, let's explicitly delete any associated favorites first
      try {
        console.log(`Attempting to delete favorites for property ID: ${id}`);
        const [favResult] = await connection.query(
          "DELETE FROM favourites WHERE property_id = ?",
          [id]
        );
        console.log(`Deleted ${favResult.affectedRows} favorites`);
      } catch (favError) {
        console.error("Error deleting favorites:", favError);
        throw favError;
      }

      // Then delete any associated bookings
      try {
        console.log(`Attempting to delete bookings for property ID: ${id}`);
        const [bookResult] = await connection.query(
          "DELETE FROM bookings WHERE property_id = ?",
          [id]
        );
        console.log(`Deleted ${bookResult.affectedRows} bookings`);
      } catch (bookError) {
        console.error("Error deleting bookings:", bookError);
        throw bookError;
      }

      // Finally, delete the property
      try {
        console.log(`Attempting to delete property with ID: ${id}`);
        const [propResult] = await connection.query(
          "DELETE FROM properties WHERE id = ?",
          [id]
        );
        console.log(`Deleted ${propResult.affectedRows} properties`);

        if (propResult.affectedRows === 0) {
          throw new Error(`Property with ID ${id} couldn't be deleted`);
        }
      } catch (propError) {
        console.error("Error deleting property:", propError);
        throw propError;
      }

      await connection.commit();
      console.log(`Successfully deleted property ID: ${id}`);

      ctx.body = {
        message: "Property deleted successfully",
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Error deleting property:", err);
    ctx.status = 500;
    ctx.body = {
      error: err.message || "Failed to delete property",
    };
  }
});

// GET: Filter properties (Public access with optional auth)
router.get("/filter", optionalAuth, validateSearchParams, async (ctx) => {
  // Set CORS headers
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
    console.log("Properties FILTER request received", ctx.query);

    // Store properties query params
    const {
      location,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minPrice,
      maxPrice,
      property_type,
    } = ctx.query;

    // Update the query to join with the users table to get agent details
    let query = `
      SELECT p.*, 
             u.username AS agent_username, 
             u.user_email AS agent_email, 
             u.user_phone AS agent_phone,
             u.user_firstName AS agent_firstName,
             u.user_lastName AS agent_lastName
      FROM properties p
      LEFT JOIN users u ON p.agent_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (location) {
      query += " AND p.location LIKE ?";
      params.push(`%${location}%`);
    }

    // Handle min/max bedroom filters
    if (minBedrooms) {
      query += " AND p.bedrooms >= ?";
      params.push(minBedrooms);
    }

    if (maxBedrooms) {
      query += " AND p.bedrooms <= ?";
      params.push(maxBedrooms);
    }

    // Handle min/max bathroom filters
    if (minBathrooms) {
      query += " AND p.bathrooms >= ?";
      params.push(minBathrooms);
    }

    if (maxBathrooms) {
      query += " AND p.bathrooms <= ?";
      params.push(maxBathrooms);
    }

    if (property_type) {
      query += " AND p.property_type = ?";
      params.push(property_type);
    }

    if (minPrice) {
      query += " AND p.price >= ?";
      params.push(minPrice);
    }

    if (maxPrice) {
      query += " AND p.price <= ?";
      params.push(maxPrice);
    }

    // Add sorting
    if (ctx.query.sortBy) {
      const validColumns = [
        "price",
        "bedrooms",
        "bathrooms",
        "title",
        "location",
      ];
      const validOrders = ["ASC", "DESC"];

      // Sanitize inputs to prevent SQL injection
      const column = validColumns.includes(ctx.query.sortBy)
        ? ctx.query.sortBy
        : "id";
      const order = validOrders.includes(ctx.query.sortOrder?.toUpperCase())
        ? ctx.query.sortOrder.toUpperCase()
        : "ASC";

      query += ` ORDER BY p.${column} ${order}`;
    } else {
      // Default sort by newest (id DESC)
      query += " ORDER BY p.id DESC";
    }

    // Add limit
    if (ctx.query.limit && !isNaN(parseInt(ctx.query.limit))) {
      query += " LIMIT ?";
      params.push(parseInt(ctx.query.limit));
    }

    console.log("Executing SQL query:", query);
    console.log("With parameters:", params);

    const [properties] = await pool.query(query, params);

    console.log(
      `Query returned ${properties.length} properties:`,
      properties.map((p) => `ID: ${p.id}, Title: ${p.title}`).slice(0, 5)
    );

    // Get user role from state
    const userLevel = ctx.state.user ? ctx.state.user.user_levels : -1;

    // Set appropriate role-based headers
    if (userLevel >= 1) {
      ctx.set("X-Agent-Access", "true");
    }
    if (userLevel >= 2) {
      ctx.set("X-Admin-Access", "true");
    }

    // Map properties with links
    const propertiesWithLinks = properties.map((p) => {
      // Base links for all users
      const links = {
        self: { href: `/properties/${p.id}`, method: "GET" },
      };

      // Add agent/admin specific links
      if (userLevel >= 1) {
        links.update = { href: `/properties/${p.id}`, method: "PUT" };

        // Check if the agent is the owner or user is admin
        if (
          ctx.state.user &&
          (ctx.state.user.user_id === p.agent_id || userLevel >= 2)
        ) {
          links.delete = {
            href: `/properties/${p.id}`,
            method: "DELETE",
          };
        }
      }

      // Add links for authenticated users
      if (userLevel >= 0) {
        links.book = {
          href: `/bookings`,
          method: "POST",
          description: "Book a viewing",
        };
        links.favorite = {
          href: `/favourites/${p.id}`,
          method: "POST",
          description: "Add to favorites",
        };
      }

      return {
        ...p,
        _links: links,
        agent: {
          id: p.agent_id,
          username: p.agent_username,
          email: p.agent_email,
          phone: p.agent_phone,
          firstName: p.agent_firstName,
          lastName: p.agent_lastName,
        },
      };
    });

    // Collection-level links
    const collectionLinks = {
      self: { href: "/properties", method: "GET" },
    };

    // Add agent-specific collection links
    if (userLevel >= 1) {
      collectionLinks.create = {
        href: "/properties",
        method: "POST",
        description: "Create new property",
      };
    }

    ctx.body = {
      data: propertiesWithLinks,
      _links: collectionLinks,
      count: properties.length,
    };
  } catch (err) {
    console.error("Error fetching filtered properties:", err);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

module.exports = router;
