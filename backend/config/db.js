const mysql = require('mysql2/promise');
require('dotenv').config(); // Ensure environment variables are loaded

// Load database credentials from environment variables
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Debugging logs to confirm correct values
console.log("🔍 Establishing MySQL Connection...");
console.log("📌 DB_HOST:", DB_HOST);
console.log("📌 DB_USER:", DB_USER);
console.log("📌 DB_PASSWORD:", DB_PASSWORD ? "********" : "NOT SET"); // Hide password in logs
console.log("📌 DB_NAME:", DB_NAME);

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection when server starts
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Database Connected Successfully!");
    connection.release(); // Release connection back to the pool
  } catch (error) {
    console.error("🚨 MySQL Connection Failed:", error.message);
    process.exit(1); // Stop execution if database connection fails
  }
})();

module.exports = pool;
