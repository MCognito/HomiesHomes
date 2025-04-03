/**
 * Test environment setup
 *
 * Sets up everything we need for testing - app, DB connection, etc.
 */

const Koa = require("koa");
const request = require("supertest");
const mysql = require("mysql2/promise");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
require("dotenv").config({ path: ".env.test" });

// Start with a fresh Koa app
const app = new Koa();

// Add the middleware we need
app.use(cors());
app.use(bodyParser());

// Grab all our route modules
const usersRoutes = require("../routes/users");
const propertyRoutes = require("../routes/properties");
const agentRequestsRoutes = require("../routes/agent-requests");
const favouritesRoutes = require("../routes/favourites");
const bookingRoutes = require("../routes/bookings");

// Hook up all the routes
app.use(usersRoutes.routes());
app.use(propertyRoutes.routes());
app.use(agentRequestsRoutes.routes());
app.use(favouritesRoutes.routes());
app.use(bookingRoutes.routes());

// Get the server running
const server = app.listen();

// Set up DB connection for tests
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "homieshomes_test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Track connection state
let connectionError = null;
let isConnected = false;

// Function to make sure DB is working
const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Test database connected successfully");
    connection.release();
    isConnected = true;
    return true;
  } catch (err) {
    console.error("❌ Failed to connect to test database:", err);
    connectionError = err;
    isConnected = false;
    return false;
  }
};

// Try connecting right away
checkDatabaseConnection();

// Before running any tests, make sure DB is ready
beforeAll(async () => {
  // Check connection if we're not already connected
  if (!isConnected) {
    await checkDatabaseConnection();
  }
});

// Clean up after all tests are done
afterAll(async () => {
  try {
    // Shut down the test server
    server.close();

    // Close database connections
    await pool.end();
    console.log("✅ Test database connection closed");
  } catch (error) {
    console.error("Error during test cleanup:", error);
  }
});

module.exports = {
  app,
  pool,
  request: request(server),
  isConnected: () => isConnected,
  connectionError: () => connectionError,
};
