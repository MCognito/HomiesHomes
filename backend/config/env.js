require("dotenv").config();

const isTest = process.env.NODE_ENV === "test";

// Provide safe local defaults for development if .env values are missing
const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || (isTest ? "homieshomes_test" : "homieshomes");
const jwtSecret = process.env.JWT_SECRET || (isTest ? "test-secret" : undefined);
const port = Number(process.env.PORT) || 9001; // align with README but works locally

// Only hard-crash if truly missing in non-test environments
if (!jwtSecret && !isTest) {
  console.error("JWT_SECRET is required. Set it in .env (e.g., JWT_SECRET=change_me).\nRefusing to start without it in non-test environment.");
  process.exit(1);
}

module.exports = {
  dbHost,
  dbUser,
  dbPassword,
  dbName,
  jwtSecret: jwtSecret || "test-secret",
  port,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000").split(","),
};
