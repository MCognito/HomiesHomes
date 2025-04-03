/**
 * HomiesHomes API Server
 * The complete backend with all middlewares and routes
 */

require("dotenv").config();
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const fs = require("fs");
const path = require("path");
const { koaBody } = require("koa-body");
const serve = require("koa-static");
const mount = require("koa-mount");
const logger = require("koa-logger");
const responseTime = require("koa-response-time");
const compress = require("koa-compress");
const hateoas = require("./middlewares/hateoas");

// Get custom middleware
const corsMiddleware = require("./middlewares/corsOptions");
const errorHandler = require("./middlewares/errorHandler");
const addHateoasLinks = require("./middlewares/hateoas").addHateoasLinks;

// Routes
const usersRoutes = require("./routes/users");
const propertiesRoutes = require("./routes/properties");
const bookingsRoutes = require("./routes/bookings");
const favouritesRoutes = require("./routes/favourites");
const agentRequestsRoutes = require("./routes/agent-requests");

// Load configuration
const { port } = require("./config/env");
const pool = require("./config/db");

// Create app
const app = new Koa();

// Prevent unexpected errors from crashing the server
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  console.error("Stack trace:", err.stack);
});

// Set up cross-origin requests
app.use(corsMiddleware);

// Add extra middleware
app.use(errorHandler);
app.use(bodyParser());
app.use(addHateoasLinks); // Makes API more discoverable

// Share documentation
app.use(mount("/docs/openapi", serve(path.join(__dirname, "docs/openapi"))));
app.use(mount("/schemas", serve(path.join(__dirname, "docs/schemas"))));

// Check if the agent_requests table needs to be set up
(async () => {
  try {
    console.log("🔍 Checking if agent_requests table exists...");

    // Look for the table in the database
    const [tables] = await pool.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agent_requests'",
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log("⚠️ agent_requests table does not exist. Creating it...");

      // Create the table with all needed columns
      await pool.query(`
        CREATE TABLE agent_requests (
          request_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          request_date DATETIME NOT NULL,
          response_date DATETIME,
          status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
          request_reason TEXT,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Add indexes to speed up common queries
      await pool.query("CREATE INDEX idx_user_id ON agent_requests(user_id)");
      await pool.query("CREATE INDEX idx_status ON agent_requests(status)");

      console.log("✅ agent_requests table created successfully!");
    } else {
      console.log("✅ agent_requests table already exists.");
    }
  } catch (error) {
    console.error(
      "🚨 Error checking/creating agent_requests table:",
      error.message
    );
  }
})();

// Create a root endpoint that explains what's available
app.use(async (ctx, next) => {
  if (ctx.path === "/" && ctx.method === "GET") {
    // Figure user making the request
    const user = ctx.state.user;
    const userLevel = user ? user.user_levels : -1;

    // All the resources API offers
    const resources = [
      {
        name: "properties",
        description: "Property listings",
        uri: "/properties",
        methods: ["GET", "POST"],
        public: true,
      },
      {
        name: "bookings",
        description: "Property viewing bookings",
        uri: "/bookings",
        methods: ["GET", "POST"],
        public: false,
      },
      {
        name: "favourites",
        description: "User favourite properties",
        uri: "/favourites",
        methods: ["GET", "POST", "DELETE"],
        public: false,
      },
      {
        name: "users",
        description: "User accounts",
        uri: "/users",
        methods: ["GET", "POST", "PUT"],
        public: false,
      },
      {
        name: "agent-requests",
        description: "Agent role requests",
        uri: "/agent-requests",
        methods: ["GET", "POST", "PUT"],
        public: false,
      },
      {
        name: "login",
        description: "User authentication",
        uri: "/login",
        methods: ["POST"],
        public: true,
      },
      {
        name: "register",
        description: "User registration",
        uri: "/register",
        methods: ["POST"],
        public: true,
      },
      {
        name: "documentation",
        description: "API documentation",
        uri: "/docs/openapi",
        methods: ["GET"],
        public: true,
      },
    ];

    // Only show what the user has access to
    const availableResources = resources.filter(
      (resource) => resource.public || userLevel >= 0
    );

    // Package everything up in response
    ctx.status = 200;
    ctx.body = {
      name: "HomiesHomes API",
      version: "1.0.0",
      description: "RESTful API for HomiesHomes property listings platform",
      endpoints: availableResources,
    };

    return;
  }

  await next();
});

// Set up all our routes with their methods
app.use(usersRoutes.routes()).use(usersRoutes.allowedMethods());
app.use(propertiesRoutes.routes()).use(propertiesRoutes.allowedMethods());
app.use(bookingsRoutes.routes()).use(bookingsRoutes.allowedMethods());
app.use(favouritesRoutes.routes()).use(favouritesRoutes.allowedMethods());
app.use(agentRequestsRoutes.routes()).use(agentRequestsRoutes.allowedMethods());

// Give a response for any missed routes
app.use((ctx) => {
  if (ctx.status === 404 || ctx.body === undefined) {
    ctx.status = 404;
    ctx.body = {
      message: "Endpoint not found",
      status: 404,
      path: ctx.path,
      method: ctx.method,
    };
  }
});

// Start the server
try {
  const server = app.listen(port, () => {
    console.log(`🚀 Koa server running on port ${port}`);
    console.log(`CORS enabled with role-based header exposure`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
  });
} catch (err) {
  console.error("Failed to start server:", err);
}
