const mysql = require("mysql2/promise");
require("dotenv").config(); // Loads environment variables

// Get database info from .env
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Log the connection details (password stays hidden)
console.log("🔍 Setting up MySQL Connection...");
console.log("📌 DB_HOST:", DB_HOST);
console.log("📌 DB_USER:", DB_USER);
console.log("📌 DB_PASSWORD:", DB_PASSWORD ? "********" : "NOT SET");
console.log("📌 DB_NAME:", DB_NAME);

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
