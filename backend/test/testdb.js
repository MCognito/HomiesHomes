require('dotenv').config();
const mysql = require('mysql2/promise');

(async function testDbConnection() {
  console.log("🔍 Checking MySQL Connection Variables...");
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
  console.log("DB_NAME:", process.env.DB_NAME);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log("✅ MySQL Connection Successful!");
    connection.end();
  } catch (error) {
    console.error("🚨 MySQL Connection Error:", error);
  }
})();
