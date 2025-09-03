const Router = require("koa-router");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { jwtSecret, allowedOrigins } = require("../config/env");
const { authMiddleware, requireRole } = require("../middlewares/auth");
const { sanitizeString } = require("../controllers/validation");
const {
  validateUser,
  validateLogin,
  validateUserUpdate,
  validateAgentRequest,
  validateAgentRequestStatus,
} = require("../controllers/validation");

// Create router with prefix
const router = new Router();

// Ensure JWT Secret is properly loaded
if (!jwtSecret) {
  console.error("❌ ERROR: JWT_SECRET is not defined. Check your .env file.");
  process.exit(1); // Stop execution if JWT_SECRET is missing
}

// Helper function to set CORS headers dynamically using env-configured origins
const setCorsHeaders = (ctx) => {
  const origin = ctx.request.headers.origin;
  const configuredOrigins = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : String(allowedOrigins || "").split(",").filter(Boolean);

  if (origin && (configuredOrigins.includes(origin) || /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    ctx.set("Access-Control-Allow-Origin", origin);
    ctx.set("Access-Control-Allow-Credentials", "true");
  }
};

// Handle OPTIONS request for CORS preflight for register
router.options("/register", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  ctx.status = 204;

  console.log("Register OPTIONS request handled with CORS headers");
});

// Register a new user (all new users get level 0)
router.post("/register", validateUser, async (ctx) => {
  console.log("Register request received:", ctx.request.body);
  // Set CORS headers for the register route
  setCorsHeaders(ctx);

  const {
    username,
    password,
    user_email,
    user_phone,
    user_firstName,
    user_lastName,
    user_levels,
  } = ctx.request.body;

  try {
    // Sanitise inputs to prevent XSS
    const sanitizedUsername = sanitizeString(username);
    const sanitizedEmail = sanitizeString(user_email);
    const sanitizedPhone = sanitizeString(user_phone || "");
    const sanitizedFirstName = sanitizeString(user_firstName || "");
    const sanitizedLastName = sanitizeString(user_lastName || "");

    // Password isn't sanitised as it will be hashed

    // Use proper destructuring to get only user records (ignoring metadata)
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR user_email = ?",
      [sanitizedUsername, sanitizedEmail]
    );

    // Debugging Log
    console.log("🛠 SQL Query Result for Existing User Check:", existingUsers);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === sanitizedUsername) {
        console.log("🚨 Username already exists:", sanitizedUsername);
        ctx.status = 400;
        ctx.body = { message: "Username already exists" };
        return;
      }
      if (existingUser.user_email === sanitizedEmail) {
        console.log("🚨 Email already exists:", sanitizedEmail);
        ctx.status = 400;
        ctx.body = { message: "Email already in use" };
        return;
      }
    }

    console.log("✅ Username is available, proceeding with registration...");

    // 🚨 Debugging: Ensure password is being hashed correctly
    console.log("🔑 Hashing password:", password);
    const hash = bcrypt.hashSync(password, 10);

    // Convert user_levels to integer (0, 1, 2)
    let userLevelValue = 0; // Default to regular user (0)

    if (user_levels !== undefined) {
      const levelNum = Number(user_levels);
      // Only allow valid level values
      userLevelValue = levelNum === 1 || levelNum === 2 ? levelNum : 0;
    }

    const [result] = await pool.query(
      "INSERT INTO users (username, password, user_email, user_phone, user_firstName, user_lastName, user_levels) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        sanitizedUsername,
        hash,
        sanitizedEmail,
        sanitizedPhone,
        sanitizedFirstName,
        sanitizedLastName,
        userLevelValue,
      ]
    );

    const newUserId = result.insertId;
    console.log("🔑 Generating JWT with secret:", jwtSecret);

    const token = jwt.sign(
      {
        user_id: newUserId,
        username: sanitizedUsername,
        user_levels: userLevelValue,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    ctx.status = 201;
    ctx.body = {
      message: "User registered successfully",
      token,
      user: {
        user_id: newUserId,
        username: sanitizedUsername,
        user_email: sanitizedEmail,
        user_firstName: sanitizedFirstName,
        user_lastName: sanitizedLastName,
        user_levels: userLevelValue,
      },
    };
  } catch (err) {
    console.error("🚨 Registration error:", err.stack);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

// Handle OPTIONS request for CORS preflight
router.options("/login", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log("Login OPTIONS request handled with CORS headers");
});

// Login endpoint: validate credentials and generate JWT
router.post("/login", validateLogin, async (ctx) => {
  // Set CORS headers explicitly for the login route
  setCorsHeaders(ctx);

  // Log the request for debugging
  console.log("Login request received:", {
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.request.body,
  });

  const { username, password } = ctx.request.body;

  try {
    // Sanitise input (prevent SQL injection)
    const sanitizedUsername =
      typeof username === "string" ? username.trim() : "";

    // Use parameterised query to prevent SQL injection
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      sanitizedUsername,
    ]);

    // 🚨 Debugging: Log user record retrieved from DB
    console.log("🔍 Retrieved user from DB:", users);

    if (users.length === 0) {
      ctx.status = 401;
      ctx.body = { message: "Invalid credentials" };
      return;
    }

    const user = users[0];

    // 🚨 Debugging: Check if user has a password in DB
    console.log("🔍 Stored Password in DB:", user.password);

    if (!user.password) {
      console.error("❌ ERROR: User password is NULL or undefined in DB!");
      ctx.status = 500;
      ctx.body = { message: "Server error: Password is missing from database" };
      return;
    }

    const valid = bcrypt.compareSync(password, user.password);

    if (!valid) {
      ctx.status = 401;
      ctx.body = { message: "Invalid credentials" };
      return;
    }

    console.log("🔑 Generating JWT with secret:", jwtSecret);

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        user_levels: user.user_levels,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    // Set response
    ctx.status = 200;
    ctx.body = {
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        user_levels: user.user_levels,
        user_level: user.user_levels,
        user_firstName: user.user_firstName,
        user_lastName: user.user_lastName,
        user_email: user.user_email,
      },
    };

    // Log the response for debugging
    console.log("Login response sent:", {
      status: ctx.status,
      headers: ctx.response.headers,
      body: ctx.body,
    });
  } catch (err) {
    console.error("🚨 Login error:", err.stack);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

// Admin endpoint: list all users with HATEOAS links (requires admin level 2)
router.get("/users", authMiddleware, requireRole(2), async (ctx) => {
  try {
    const [users] = await pool.query(
      "SELECT user_id, username, user_email, user_phone, user_firstName, user_lastName, user_levels FROM users"
    );
    const response = {
      data: users.map((user) => ({
        ...user,
        links: {
          self: `/users/${user.user_id}`,
          update: `/users/${user.user_id}/role`,
        },
      })),
      links: { self: "/users" },
    };
    ctx.body = response;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { message: "Server error" };
  }
});

// Get a user by ID (user can access their own profile, admin can access any)
router.get("/users/:id", authMiddleware, async (ctx) => {
  try {
    const { id } = ctx.params;
    const currentUser = ctx.state.user;

    // Check permissions: only allow users to access their own profile unless they're an admin
    if (currentUser.user_id !== parseInt(id) && currentUser.user_levels < 2) {
      ctx.status = 403;
      ctx.body = { message: "Access denied" };
      return;
    }

    const [users] = await pool.query(
      "SELECT user_id, username, user_email, user_phone, user_firstName, user_lastName, user_levels FROM users WHERE user_id = ?",
      [id]
    );

    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { message: "User not found" };
      return;
    }

    ctx.body = {
      ...users[0],
      links: {
        self: `/users/${users[0].user_id}`,
        update:
          currentUser.user_levels === 2
            ? `/users/${users[0].user_id}/role`
            : null,
      },
    };
  } catch (err) {
    console.error("Get user error:", err);
    ctx.status = 500;
    ctx.body = { message: "Server error" };
  }
});

// Admin endpoint: update a user's role
router.put(
  "/users/:id/role",
  authMiddleware,
  requireRole(2),
  validateUserUpdate,
  async (ctx) => {
    const { id } = ctx.params;
    const { user_levels } = ctx.request.body;

    try {
      await pool.query("UPDATE users SET user_levels = ? WHERE user_id = ?", [
        user_levels,
        id,
      ]);

      // Generate a new token with updated user levels
      // First, get the updated user data
      const [users] = await pool.query(
        "SELECT * FROM users WHERE user_id = ?",
        [id]
      );

      if (users.length === 0) {
        ctx.status = 404;
        ctx.body = { message: "User not found" };
        return;
      }

      const user = users[0];

      // Generate new token with updated role
      const token = jwt.sign(
        {
          user_id: user.user_id,
          username: user.username,
          user_levels: user.user_levels,
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      ctx.body = {
        message: "User role updated",
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          user_levels: user.user_levels,
          user_firstName: user.user_firstName,
          user_lastName: user.user_lastName,
          user_email: user.user_email,
        },
      };
    } catch (err) {
      console.error("Update user role error:", err);
      ctx.status = 500;
      ctx.body = { message: "Server error", error: err.message };
    }
  }
);

// Handle OPTIONS request for agent-request
router.options("/agent-request", async (ctx) => {
  setCorsHeaders(ctx);
  ctx.set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204;
  console.log("User route OPTIONS handled successfully");
});

// Forward agent-request GET to the correct endpoint
router.get("/agent-request", authMiddleware, async (ctx) => {
  console.log("Forwarding agent-request GET to /agent-requests/status");
  // Set CORS headers
  setCorsHeaders(ctx);

  // Redirect to the correct endpoint
  ctx.redirect("/agent-requests/status");
});

// Submit agent request
router.post(
  "/agent-request",
  authMiddleware,
  validateAgentRequest,
  async (ctx) => {
    console.log("Forwarding agent-request POST to /agent-requests");
    // Set CORS headers
    setCorsHeaders(ctx);

    // Redirect to the correct endpoint
    ctx.redirect(307, "/agent-requests");
  }
);

// Admin endpoint: delete a user (requires admin level 2)
router.delete("/users/:id", authMiddleware, requireRole(2), async (ctx) => {
  try {
    const { id } = ctx.params;
    const adminId = ctx.state.user.user_id;

    // Don't allow admins to delete themselves
    if (parseInt(id) === adminId) {
      ctx.status = 403;
      ctx.body = { message: "You cannot delete your own admin account" };
      return;
    }

    // Check if user exists
    const [users] = await pool.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);

    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { message: "User not found" };
      return;
    }

    const user = users[0];

    // Don't allow deleting other admin accounts
    if (user.user_levels === 2) {
      ctx.status = 403;
      ctx.body = { message: "Cannot delete other admin accounts" };
      return;
    }

    // Begin a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // If the user is an agent, first delete their properties
      // This will cascade delete related bookings and favorites due to FK constraints
      if (user.user_levels === 1) {
        console.log(`Deleting properties for agent with ID ${id}`);
        const [propertyResult] = await connection.query(
          "DELETE FROM properties WHERE agent_id = ?",
          [id]
        );
        console.log(`Deleted ${propertyResult.affectedRows} properties`);
      }

      // Delete related records
      // Agent requests
      await connection.query("DELETE FROM agent_requests WHERE user_id = ?", [
        id,
      ]);
      // Favorites
      await connection.query("DELETE FROM favourites WHERE user_id = ?", [id]);
      // Delete bookings made by this user
      await connection.query("DELETE FROM bookings WHERE user_id = ?", [id]);

      // For bookings where this user is the agent, the ON DELETE SET NULL in the
      // foreign key constraint will automatically set agent_id to NULL

      // Finally delete the user
      const [result] = await connection.query(
        "DELETE FROM users WHERE user_id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Failed to delete user");
      }

      await connection.commit();

      ctx.body = {
        message: "User deleted successfully",
        links: {
          users: "/users",
        },
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Delete user error:", err);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

module.exports = router;
