const Router = require("koa-router");
const pool = require("../config/db");
const { authMiddleware } = require("../middlewares/auth");

const router = new Router({ prefix: "/favourites" });

// Handle OPTIONS request for CORS preflight
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

  console.log("Favourites OPTIONS request handled with CORS headers");
});

// Handle OPTIONS request for specific favourite ID
router.options("/:property_id", async (ctx) => {
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
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
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  const { property_id } = ctx.request.body;
  const user_id = ctx.state.user.user_id;

  console.log(`Adding favourite: User ${user_id}, Property ${property_id}`);

  try {
    await pool.query(
      "INSERT INTO favourites (user_id, property_id) VALUES (?, ?)",
      [user_id, property_id]
    );
    ctx.status = 201;
    ctx.body = { message: "Property favourited", success: true };
  } catch (err) {
    console.error("Error adding favourite:", err);
    if (err.code === "ER_DUP_ENTRY") {
      ctx.status = 409;
      ctx.body = { message: "Already favourited" };
    } else {
      ctx.status = 500;
      ctx.body = { message: "Server error", error: err.message };
    }
  }
});

// GET: User's favourites
router.get("/", authMiddleware, async (ctx) => {
  // Set CORS headers
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  const user_id = ctx.state.user.user_id;
  console.log(`Fetching favourites for user: ${user_id}`);

  try {
    const [favs] = await pool.query(
      `SELECT p.*, f.property_id 
       FROM properties p
       JOIN favourites f ON p.id = f.property_id
       WHERE f.user_id = ?`,
      [user_id]
    );

    console.log(`Found ${favs.length} favourites for user ${user_id}`);
    ctx.body = {
      data: favs,
      links: { self: "/favourites" },
    };
  } catch (err) {
    console.error("Error fetching favourites:", err);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

// DELETE: Unfavourite a property
router.delete("/:property_id", authMiddleware, async (ctx) => {
  // Set CORS headers
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  const { property_id } = ctx.params;
  const user_id = ctx.state.user.user_id;

  console.log(`Removing favourite: User ${user_id}, Property ${property_id}`);

  try {
    const [result] = await pool.query(
      "DELETE FROM favourites WHERE user_id = ? AND property_id = ?",
      [user_id, property_id]
    );

    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = { message: "Favourite not found" };
      return;
    }

    ctx.body = { message: "Favourite removed", success: true };
  } catch (err) {
    console.error("Error removing favourite:", err);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

module.exports = router;
