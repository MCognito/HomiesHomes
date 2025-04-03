/**
 * Test Database Setup Script
 *
 * This script creates and initializes the test database
 */

const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: ".env.test" });

async function setupTestDatabase() {
  console.log("🔄 Starting test database setup...");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create test database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    console.log(`✅ Created database: ${process.env.DB_NAME}`);

    // Use the test database
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`✅ Using database: ${process.env.DB_NAME}`);

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, "..", "schemas", "schema.sql");
    console.log(`📄 Reading schema from: ${schemaPath}`);

    const fs = require("fs");
    const schema = fs.readFileSync(schemaPath, "utf8");
    const statements = schema.split(";").filter((stmt) => stmt.trim());

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (error) {
          console.error(
            `❌ Error executing statement: ${statement.substring(0, 50)}...`
          );
          console.error(`Error details: ${error.message}`);
          throw error;
        }
      }
    }

    console.log("✅ Test database schema initialized successfully");
  } catch (error) {
    console.error("❌ Error setting up test database:");
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error code: ${error.code}`);
    if (error.sqlMessage) {
      console.error(`SQL Error: ${error.sqlMessage}`);
    }
    throw error;
  } finally {
    await connection.end();
    console.log("✅ Database connection closed");
  }
}

// Run setup
setupTestDatabase().catch((error) => {
  console.error("❌ Test database setup failed");
  process.exit(1);
});
