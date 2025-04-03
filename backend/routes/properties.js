const Router = require("koa-router");
const koaBody = require("koa-body");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const { authMiddleware, requireRole } = require("../middlewares/auth");
const {
  createValidator,
  sanitizeString,
} = require("../middlewares/validation");
const {
  createPropertySchema,
  updatePropertySchema,
} = require("../schemas/properties");
const {
  validateProperty,
  validatePropertyUpdate,
} = require("../controllers/validation");

const router = new Router({ prefix: "/properties" });

// Handle OPTIONS request for CORS preflight on collection routes
router.options("/", async (ctx) => {
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
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
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
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
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log("Property filter OPTIONS request handled with CORS headers");
});

// GET: All properties (Public access)
router.get("/", async (ctx) => {
  // Set CORS headers for the response
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  console.log("Properties GET request received:", ctx.query);

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

  // Optional: If you're storing listing type (e.g., 'Rent', 'Sale'), filter here
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

    // Sanitize inputs to prevent SQL injection
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
    const [properties] = await pool.query(query, params);

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
router.get("/:id", async (ctx) => {
  // Set CORS headers for the response
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  console.log(`Property GET request received for ID: ${ctx.params.id}`);

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
      ctx.body = { message: "Property not found" };
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
      links.update = { href: `/properties/${property.id}`, method: "PUT" };

      // Check if the agent is the owner of this property
      if (
        ctx.state.user &&
        (ctx.state.user.user_id === property.agent_id || userLevel >= 2)
      ) {
        links.delete = { href: `/properties/${property.id}`, method: "DELETE" };
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
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  try {
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

    // Sanitize inputs (basic XSS protection)
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedLocation = sanitizeString(location);
    const sanitizedPropertyType = sanitizeString(property_type);
    const sanitizedImageUrl = sanitizeString(image_url || "prop1.jpg");

    // Convert numeric values
    const sanitizedPrice = parseFloat(price);
    const sanitizedBedrooms = parseInt(bedrooms, 10);
    const sanitizedBathrooms = parseInt(bathrooms, 10);

    const agent_id = ctx.state.user.user_id;

    // Use parameterized query to prevent SQL injection
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
router.put(
  "/:id",
  authMiddleware,
  requireRole(1),
  validatePropertyUpdate,
  async (ctx) => {
    // Set CORS headers
    ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
    ctx.set("Access-Control-Allow-Credentials", "true");

    try {
      const { id } = ctx.params;
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

      // Check if property exists and if user has permission to update it
      const [properties] = await pool.query(
        "SELECT * FROM properties WHERE id = ?",
        [id]
      );

      if (properties.length === 0) {
        ctx.status = 404;
        ctx.body = { message: "Property not found" };
        return;
      }

      const property = properties[0];
      const userLevel = ctx.state.user.user_levels;
      const userId = ctx.state.user.user_id;

      // Check if user is agent of this property or an admin
      if (userLevel < 2 && property.agent_id !== userId) {
        ctx.status = 403;
        ctx.body = {
          message: "You don't have permission to update this property",
        };
        return;
      }

      // Sanitize inputs (basic XSS protection)
      const sanitizedTitle = sanitizeString(title);
      const sanitizedDescription = sanitizeString(description);
      const sanitizedLocation = sanitizeString(location);
      const sanitizedPropertyType = sanitizeString(property_type);
      const sanitizedImageUrl = sanitizeString(image_url || "prop1.jpg");

      // Convert numeric values
      const sanitizedPrice = parseFloat(price);
      const sanitizedBedrooms = parseInt(bedrooms, 10);
      const sanitizedBathrooms = parseInt(bathrooms, 10);

      // Use parameterized query to prevent SQL injection
      await pool.query(
        "UPDATE properties SET title=?, description=?, price=?, location=?, bedrooms=?, bathrooms=?, property_type=?, image_url=? WHERE id=?",
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

      // Create HATEOAS response
      const links = {
        self: { href: `/properties/${id}`, method: "GET" },
        update: { href: `/properties/${id}`, method: "PUT" },
        delete: { href: `/properties/${id}`, method: "DELETE" },
      };

      ctx.body = {
        message: "Property updated successfully",
        _links: links,
      };
    } catch (error) {
      console.error("Error updating property:", error);
      ctx.status = 500;
      ctx.body = {
        message: "Failed to update property",
        error: error.message,
      };
    }
  }
);

// DELETE: Property (Agents only)
router.delete("/:id", authMiddleware, requireRole(1), async (ctx) => {
  const { id } = ctx.params;
  await pool.query("DELETE FROM properties WHERE id = ?", [id]);
  ctx.body = { message: "Property deleted" };
});

module.exports = router;
