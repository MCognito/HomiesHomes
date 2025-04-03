const Router = require("koa-router");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { jwtSecret } = require("../config/env");
const { authMiddleware, requireRole } = require("../middlewares/auth");
const {
  createValidator,
  sanitizeString,
} = require("../middlewares/validation");
const {
  registerSchema,
  loginSchema,
  updateRoleSchema,
} = require("../schemas/users");

// Create router with prefix
const router = new Router();

// Ensure JWT Secret is properly loaded
if (!jwtSecret) {
  console.error("❌ ERROR: JWT_SECRET is not defined. Check your .env file.");
  process.exit(1); // Stop execution if JWT_SECRET is missing
}

// Handle OPTIONS request for CORS preflight for register
router.options("/register", async (ctx) => {
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept"
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
  ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
  ctx.status = 204; // No content for OPTIONS

  console.log("Register OPTIONS request handled with CORS headers");
});

// Register a new user (all new users get level 0)
router.post("/register", createValidator(registerSchema), async (ctx) => {
  console.log("Register request received:", ctx.request.body);
  // Set CORS headers for the register route
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  const {
    username,
    password,
    user_email,
    user_phone,
    user_firstName,
    user_lastName,
  } = ctx.request.body;

  try {
    // Sanitize inputs to prevent XSS
    const sanitizedUsername = sanitizeString(username);
    const sanitizedEmail = sanitizeString(user_email);
    const sanitizedPhone = sanitizeString(user_phone || "");
    const sanitizedFirstName = sanitizeString(user_firstName || "");
    const sanitizedLastName = sanitizeString(user_lastName || "");

    // Password isn't sanitized as it will be hashed

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

    const [result] = await pool.query(
      "INSERT INTO users (username, password, user_email, user_phone, user_firstName, user_lastName, user_levels) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        sanitizedUsername,
        hash,
        sanitizedEmail,
        sanitizedPhone,
        sanitizedFirstName,
        sanitizedLastName,
        0,
      ]
    );

    const newUserId = result.insertId;
    console.log("🔑 Generating JWT with secret:", jwtSecret);

    const token = jwt.sign(
      { user_id: newUserId, username: sanitizedUsername, user_levels: 0 },
      jwtSecret,
      { expiresIn: "1h" }
    );

    ctx.status = 201;
    ctx.body = { message: "User registered successfully", token };
  } catch (err) {
    console.error("🚨 Registration error:", err.stack);
    ctx.status = 500;
    ctx.body = { message: "Server error", error: err.message };
  }
});

// Handle OPTIONS request for CORS preflight
router.options("/login", async (ctx) => {
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
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
router.post("/login", createValidator(loginSchema), async (ctx) => {
  // Set CORS headers explicitly for the login route
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set("Access-Control-Allow-Credentials", "true");

  // Log the request for debugging
  console.log("Login request received:", {
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.request.body,
  });

  const { username, password } = ctx.request.body;

  try {
    // Sanitize input (prevent SQL injection)
    const sanitizedUsername =
      typeof username === "string" ? username.trim() : "";

    // Use parameterized query to prevent SQL injection
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

// Admin endpoint: update a user's role
router.put(
  "/users/:id/role",
  authMiddleware,
  requireRole(2),
  createValidator(updateRoleSchema),
  async (ctx) => {
    const { id } = ctx.params;
    const { user_levels } = ctx.request.body;

    try {
      await pool.query("UPDATE users SET user_levels = ? WHERE user_id = ?", [
        user_levels,
        id,
      ]);
      ctx.body = { message: "User role updated" };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { message: "Server error" };
    }
  }
);

module.exports = router;
