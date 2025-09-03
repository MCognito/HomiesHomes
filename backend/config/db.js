const mysql = require("mysql2/promise");
require("dotenv").config(); // Loads environment variables
const { dbHost, dbUser, dbPassword, dbName } = require("./env");

// Log the connection details (password stays hidden)
console.log("🔍 Setting up MySQL Connection...");
console.log("📌 DB_HOST:", dbHost);
console.log("📌 DB_USER:", dbUser);
console.log("📌 DB_PASSWORD:", dbPassword ? "********" : "NOT SET");
console.log("📌 DB_NAME:", dbName);

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10, // Max 10 connections at once
  queueLimit: 0, // No limit on connection queue
});

// Quick connection test when server starts
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL Database!");
    connection.release(); // Put connection back in the pool
  } catch (error) {
    console.error("🚨 Database Connection Failed:", error.message);
    // Only crash if not in testing mode
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
})();

module.exports = pool;
