/**
 * Authentication middleware
 * Verifies user tokens and protects API routes
 */

const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

/**
 * Verifies the user's JWT token
 * Must be included in the Authorisation header
 */
const authMiddleware = async (ctx, next) => {
  // Skip auth for browser preflight checks
  if (ctx.method === "OPTIONS") {
    console.log(`Skipping auth for OPTIONS request to ${ctx.path}`);
    return await next();
  }

  const authHeader = ctx.headers["authorization"];

  // Log which endpoint is getting checked
  console.log(`Authentication check for path: ${ctx.path}`);

  if (!authHeader) {
    console.log(`No Authorization header found for request to ${ctx.path}`);
    ctx.status = 401;
    ctx.body = { message: "Authentication token required" };
    return;
  }

  // Extract and verify the token
  console.log(`Authorization header found: ${authHeader.substring(0, 20)}...`);

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, jwtSecret);

    // Save the user details for later use
    console.log(
      `Token verified for user: ${payload.username} (ID: ${payload.user_id}, Role: ${payload.user_levels})`
    );

    ctx.state.user = payload;
    await next();
  } catch (err) {
    // Handle different types of token failures
    console.error(`Token verification failed for ${ctx.path}: ${err.message}`);
    if (err.name === "TokenExpiredError") {
      console.log(`Token expired at: ${new Date(err.expiredAt)}`);
      ctx.status = 401;
      ctx.body = { message: "Token expired" };
    } else {
      ctx.status = 401;
      ctx.body = { message: "Invalid token" };
    }
  }
};

/**
 * Checks if the user has sufficient role privileges
 * Minimum role level required (0=user, 1=agent, 2=admin)
 */
const requireRole = (minLevel) => {
  return async (ctx, next) => {
    // Skip role checks for preflight requests
    if (ctx.method === "OPTIONS") {
      console.log(`Skipping role check for OPTIONS request to ${ctx.path}`);
      return await next();
    }

    if (!ctx.state.user) {
      console.log(`Role check failed: No user in context for ${ctx.path}`);
      ctx.status = 403;
      ctx.body = { error: "Authentication required" };
      return;
    }

    // Map role names to numeric levels for easier comparison
    const roleMap = {
      user: 0,
      agent: 1,
      admin: 2,
    };

    // Get the user's numeric permission level
    let userLevel = ctx.state.user.user_levels;
    if (typeof userLevel === "string") {
      userLevel = roleMap[userLevel] || 0;
    }

    if (userLevel < minLevel) {
      console.log(
        `Role check failed: User ${ctx.state.user.username} has role ${ctx.state.user.user_levels} (level ${userLevel}), but level ${minLevel} is required for ${ctx.path}`
      );
      ctx.status = 403;
      ctx.body = {
        error:
          minLevel === 2 ? "Admin role required" : "Insufficient privileges",
      };
      return;
    }

    console.log(
      `Role check passed: User ${ctx.state.user.username} has sufficient privileges (${ctx.state.user.user_levels} >= ${minLevel}) for ${ctx.path}`
    );
    await next();
  };
};

module.exports = { authMiddleware, requireRole };
