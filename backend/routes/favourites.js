const Router = require("koa-router");
const pool = require("../config/db");
const { authMiddleware } = require("../middlewares/auth");

const router = new Router({ prefix: "/favourites" });

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

// Handle OPTIONS request for CORS preflight
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

  console.log("Favourites OPTIONS request handled with CORS headers");
});

// Handle OPTIONS request for specific favourite ID
router.options("/:property_id", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log(
    `Favourite ${ctx.params.property_id} OPTIONS request handled with CORS headers`
  );
});

// POST: Favourite a property
router.post("/", authMiddleware, async (ctx) => {
  // Set CORS headers
  setCorsHeaders(ctx);
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );

  const { property_id } = ctx.request.body;
  const user_id = ctx.state.user.user_id;

  console.log(`Adding favourite: User ${user_id}, Property ${property_id}`);

  try {
    console.log(
      `[DEBUG] POST /favourites: Adding property ID ${property_id} to favourites for user ${user_id}`
    );

    // Check if the property exists
    const [property] = await pool.query(
      "SELECT * FROM properties WHERE id = ?",
      [property_id]
    );
    if (property.length === 0) {
      console.log(
        `[DEBUG] POST /favourites: Property ID ${property_id} not found`
      );
      ctx.status = 404;
      ctx.body = { error: "Property not found" };
      return;
    }

    // Check if already in favourites
    const [existingFav] = await pool.query(
      "SELECT * FROM favourites WHERE user_id = ? AND property_id = ?",
      [user_id, property_id]
    );
    if (existingFav.length > 0) {
      console.log(
        `[DEBUG] POST /favourites: Property ID ${property_id} already in favourites for user ${user_id}`
      );
      ctx.status = 400;
      ctx.body = { error: "Property already in favourites" };
      return;
    }

    // Add to favourites
    await pool.query(
      "INSERT INTO favourites (user_id, property_id) VALUES (?, ?)",
      [user_id, property_id]
    );

    console.log(
      `[DEBUG] POST /favourites: Successfully added property ID ${property_id} to favourites for user ${user_id}`
    );

    ctx.status = 201;
    ctx.body = {
      message: "Property added to favourites",
      favorite: { user_id, property_id },
    };
  } catch (err) {
    console.error(`[DEBUG] POST /favourites ERROR: ${err.message}`);
    ctx.status = 500;
    ctx.body = { error: "Failed to add property to favourites" };
  }
});

// GET: User's favourites
router.get("/", authMiddleware, async (ctx) => {
  // Set CORS headers
  setCorsHeaders(ctx);
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );

  try {
    const user_id = ctx.state.user.user_id;
    console.log(
      `[DEBUG] GET /favourites: Fetching favourites for user ID: ${user_id}`
    );

    // Get favourites for the authenticated user with detailed property information
    const [favourites] = await pool.query(
      `SELECT f.user_id, f.property_id, f.favourited_at,
              p.title, p.price, p.location, p.description, 
              p.property_type, p.bedrooms, p.bathrooms, p.image_url, p.agent_id
       FROM favourites f
       JOIN properties p ON f.property_id = p.id
       WHERE f.user_id = ?`,
      [user_id]
    );

    console.log(
      `[DEBUG] GET /favourites: Found ${favourites.length} favourite(s) for user ${user_id}`
    );

    if (favourites.length > 0) {
      console.log(
        `[DEBUG] GET /favourites: First favourite property ID: ${favourites[0].property_id}`
      );
    }

    // Return the favourites
    ctx.body = favourites.map((fav) => ({
      property_id: fav.property_id,
      user_id: fav.user_id,
      favourite_date: fav.favourited_at,
      title: fav.title,
      price: fav.price,
      location: fav.location,
      description: fav.description,
      property_type: fav.property_type,
      bedrooms: fav.bedrooms,
      bathrooms: fav.bathrooms,
      image_url: fav.image_url,
      agent_id: fav.agent_id,
    }));
  } catch (err) {
    console.error(`[DEBUG] GET /favourites ERROR: ${err.message}`);
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch favourites", message: err.message };
  }
});

// DELETE: Unfavourite a property
router.delete("/:property_id", authMiddleware, async (ctx) => {
  // Set CORS headers
  setCorsHeaders(ctx);
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Cache-Control"
  );

  const property_id = parseInt(ctx.params.property_id, 10); // Ensure theres a number
  const user_id = ctx.state.user.user_id;

  try {
    console.log(
      `[DEBUG] DELETE /favourites/${property_id}: Removing from favourites for user ${user_id}`
    );

    // First check if the favorite exists to ensure consistent behavior
    const [existingFav] = await pool.query(
      "SELECT * FROM favourites WHERE user_id = ? AND property_id = ?",
      [user_id, property_id]
    );

    if (existingFav.length === 0) {
      console.log(
        `[DEBUG] DELETE /favourites/${property_id}: Property not found in favourites for user ${user_id}`
      );
      // Return 404 for consistent behavior with tests
      ctx.status = 404;
      ctx.body = { error: "Property not found in favourites" };
      return;
    }

    // Remove from favourites
    const [result] = await pool.query(
      "DELETE FROM favourites WHERE user_id = ? AND property_id = ?",
      [user_id, property_id]
    );

    console.log(
      `[DEBUG] DELETE /favourites/${property_id}: Successfully removed from favourites for user ${user_id}, affected rows: ${result.affectedRows}`
    );

    ctx.body = {
      message: "Property removed from favourites",
      success: true,
      property_id,
      user_id,
    };
  } catch (err) {
    console.error(
      `[DEBUG] DELETE /favourites/${property_id} ERROR: ${err.message}`
    );
    ctx.status = 500;
    ctx.body = {
      error: "Failed to remove property from favourites",
      message: err.message,
    };
  }
});

module.exports = router;
