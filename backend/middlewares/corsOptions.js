/**
 * CORS configuration middleware
 * Handles cross-origin requests and sets appropriate headers
 */

 const jwt = require("jsonwebtoken");
 const { jwtSecret } = require("../config/env");
 
 const corsOptionsDelegate = async (ctx, next) => {
   // Allow requests from our frontend - now supporting both origins
   const origin = ctx.request.headers.origin;
   const allowedOrigins = [
     "https://gammacairo-deltareward-9000.codio-box.uk",
     "https://gammacairo-deltareward-3000.codio-box.uk",
   ];
 
   if (allowedOrigins.includes(origin)) {
     ctx.set("Access-Control-Allow-Origin", origin);
   } else {
     // Default fallback
     ctx.set(
       "Access-Control-Allow-Origin",
       "https://gammacairo-deltareward-3000.codio-box.uk"
     );
   }
 
   ctx.set(
     "Access-Control-Allow-Headers",
     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
   );
   ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
   ctx.set("Access-Control-Allow-Credentials", "true");
   ctx.set("Access-Control-Expose-Headers", "Authorization, Link");
 
   // Handle preflight OPTIONS request
   if (ctx.method === "OPTIONS") {
     ctx.status = 204; // No content
     return;
   }
 
   // Check if user is logged in and what permissions they have
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
 
   // Set special headers based on user role
   const exposeHeaders = ["Link"];
   if (roleLevel >= 1) exposeHeaders.push("X-Agent-Access");
   if (roleLevel >= 2) exposeHeaders.push("X-Admin-Access");
 
   ctx.set("Access-Control-Expose-Headers", exposeHeaders.join(", "));
 
   // For debugging
   console.log(`CORS headers set for role level ${roleLevel}`);
 
   await next();
 };
 
 module.exports = corsOptionsDelegate;
 