/**
 * Test Database Synchronization Tool
 *
 * This script runs the SQL commands to synchronize the test database
 * tables with the main database.
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.test" });

async function syncDatabases() {
  try {
    // Read SQL from the sync script
    const sqlFilePath = path.join(__dirname, "sync_test_db.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");

    // Create connection (using .env.test credentials)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true, // Important for running multiple SQL statements
    });

    console.log("🔄 Starting database synchronization...");

    // Execute the SQL script
    const [results] = await connection.query(sql);

    console.log("✅ Database synchronization completed successfully!");
    console.log(
      "The test database now matches the structure of the main database."
    );

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error("❌ Error synchronizing databases:", error);
    process.exit(1);
  }
}

// Run the synchronization
syncDatabases();
