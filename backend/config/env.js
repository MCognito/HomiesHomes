require('dotenv').config();

console.log("Loaded ENV Variables:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("JWT_SECRET:", process.env.JWT_SECRET);  // THIS MUST NOT BE UNDEFINED

if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR: JWT_SECRET is missing from .env!");
  process.exit(1); // Stop execution if missing
}

module.exports = {
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET, // Ensure we only use env variable
  port: process.env.PORT || 4000
};
