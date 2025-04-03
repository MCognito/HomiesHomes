/**
 * Database setup
 *
 * Handles MySQL connection pool and management
 */

const mysql = require("mysql2/promise");

// Default values are used if environment variables aren't set
const {
  DB_HOST = process.env.DB_HOST || "localhost",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "homieshomes_test",
  NODE_ENV = "development",
} = process.env;

// Connection pool - more efficient than single connections
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Max number of connections
  queueLimit: 0, // Unlimited queue size
});

// Tests and establishes database connection
const connect = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`Connected to ${NODE_ENV} database: ${DB_NAME}`);
    connection.release();
    return connection;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

// Properly shuts down the connection pool
const end = async () => {
  try {
    await pool.end();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
};

module.exports = {
  pool,
  connect,
  end,
};
