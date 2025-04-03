const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const corsOptionsDelegate = async (ctx, next) => {
  let roleLevel = 0;
  const authHeader = ctx.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, jwtSecret);
      roleLevel = decoded.user_levels || 0;
      console.log(`User role level from token: ${roleLevel}`);
    } catch (err) {
      console.warn("JWT decode failed:", err.message);
    }
  }

  // Set base CORS headers
  ctx.set("Access-Control-Allow-Origin", "https://gammacairo-deltareward-3000.codio-box.uk");
  ctx.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.set("Access-Control-Allow-Credentials", "true");

  // Set role-based exposed headers
  const exposeHeaders = ["Link", "ETag"];
  if (roleLevel >= 1) exposeHeaders.push("X-Agent-Access");
  if (roleLevel >= 2) exposeHeaders.push("X-Admin-Access");

  ctx.set("Access-Control-Expose-Headers", exposeHeaders.join(", "));

  // Handle OPTIONS preflight
  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
    return;
  }

  // Log user role level and headers for debugging
  console.log(`CORS headers set for role level ${roleLevel}`);

  await next();
};

module.exports = corsOptionsDelegate;
