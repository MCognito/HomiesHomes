/**
 * Agent Requests API
 * Handles all operations related to users requesting agent status
 */

 const Router = require("koa-router");
 const { authMiddleware, requireRole } = require("../middlewares/auth");
 const pool = require("../config/db");
 const router = new Router({ prefix: "/agent-requests" });
 const { validateAgentRequest } = require("../controllers/validation");
 const corsMiddleware = require("../middlewares/corsOptions");
 
 // Set up CORS
 router.use(corsMiddleware);
 
 // Helper function to set CORS headers dynamically
 const setCorsHeaders = (ctx) => {
   const origin = ctx.request.headers.origin;
   const allowedOrigins = [
     "https://gammacairo-deltareward-9000.codio-box.uk",
     "https://gammacairo-deltareward-3000.codio-box.uk",
   ];
 
   if (allowedOrigins.includes(origin)) {
     ctx.set("Access-Control-Allow-Origin", origin);
   } else {
     ctx.set(
       "Access-Control-Allow-Origin",
       "https://gammacairo-deltareward-3000.codio-box.uk"
     );
   }
   ctx.set("Access-Control-Allow-Credentials", "true");
 };
 
 // Handle OPTIONS requests
 router.options("/(.*)", async (ctx) => {
   setCorsHeaders(ctx);
   ctx.set("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
   ctx.set(
     "Access-Control-Allow-Headers",
     "Content-Type, Authorization, Accept"
   );
   ctx.set("Access-Control-Allow-Credentials", "true");
   ctx.set("Access-Control-Max-Age", "86400"); // 24 hours
   ctx.status = 204;
   console.log("Agent-requests OPTIONS handled successfully");
 });
 
 /**
  * Get the agent request status for the current user
  * Returns the latest request if one exists
  */
 router.get("/status", authMiddleware, async (ctx) => {
   // Set CORS headers
   setCorsHeaders(ctx);
 
   try {
     const userId = ctx.state.user.user_id;
     console.log(`Fetching agent request status for user ${userId}`);
 
     const [rows] = await pool.query(
       "SELECT * FROM agent_requests WHERE user_id = ? ORDER BY request_date DESC LIMIT 1",
       [userId]
     );
 
     if (rows.length === 0) {
       ctx.status = 404;
       ctx.body = { message: "No agent request found" };
       return;
     }
 
     ctx.body = rows[0];
   } catch (err) {
     console.error("Error fetching agent request status:", err);
     ctx.status = 500;
     ctx.body = { error: err.message };
   }
 });
 
 /**
  * Create a new agent request
  * Users can submit their application to become an agent
  */
 router.post("/", authMiddleware, validateAgentRequest, async (ctx) => {
   // Set CORS headers
   setCorsHeaders(ctx);
 
   try {
     const userId = ctx.state.user.user_id;
     const { request_reason } = ctx.request.body;
 
     console.log(`Submitting new agent request for user ID: ${userId}`);
     console.log(`Reason provided: ${request_reason}`);
     console.log(`Request body:`, ctx.request.body);
 
     // Check if user already has an agent request
     const [existingRequests] = await pool.query(
       "SELECT * FROM agent_requests WHERE user_id = ? AND status = 'pending'",
       [userId]
     );
 
     console.log(
       `Found ${existingRequests.length} existing pending requests for this user`
     );
 
     if (existingRequests.length > 0) {
       ctx.status = 400;
       ctx.body = { error: "You already have a pending agent request" };
       return;
     }
 
     // Check if user is already an agent or admin
     if (ctx.state.user.user_levels > 0) {
       ctx.status = 400;
       ctx.body = { error: "You already have agent or admin privileges" };
       return;
     }
 
     // Insert the new agent request
     console.log(
       "Inserting new agent request into database with reason:",
       request_reason
     );
     const [result] = await pool.query(
       "INSERT INTO agent_requests (user_id, status, request_reason, request_date) VALUES (?, 'pending', ?, NOW())",
       [userId, request_reason]
     );
 
     console.log("Agent request created successfully:", result);
 
     // Get the newly created request to confirm
     const [newRequest] = await pool.query(
       "SELECT * FROM agent_requests WHERE request_id = ?",
       [result.insertId]
     );
 
     console.log("Newly created request:", newRequest[0]);
 
     ctx.status = 201;
     ctx.body = {
       message: "Agent request submitted successfully",
       request: {
         request_id: result.insertId,
         user_id: userId,
         status: "pending",
         request_reason: request_reason,
         request_date: new Date(),
       },
     };
   } catch (err) {
     console.error("Agent request submission error:", err);
     ctx.status = 500;
     ctx.body = { error: err.message };
   }
 });
 
 /**
  * Get all agent requests
  * Admin only - retrieves all requests with user details
  */
 router.get("/", authMiddleware, requireRole(2), async (ctx) => {
   // Set CORS headers
   setCorsHeaders(ctx);
 
   try {
     const adminId = ctx.state.user.user_id;
     console.log(`Admin ${adminId} fetching all agent requests`);
 
     // Use exact field names from the database
     const [rows] = await pool.query(`
       SELECT 
         ar.request_id, 
         ar.user_id, 
         ar.request_date, 
         ar.response_date, 
         ar.status, 
         ar.request_reason, 
         u.username, 
         u.user_email, 
         u.user_firstName, 
         u.user_lastName
       FROM agent_requests ar
       JOIN users u ON ar.user_id = u.user_id
       ORDER BY 
         CASE 
           WHEN ar.status = 'pending' THEN 1
           WHEN ar.status = 'approved' THEN 2
           WHEN ar.status = 'rejected' THEN 3
         END,
         ar.request_date DESC
     `);
 
     console.log(`Found ${rows.length} agent requests`);
 
     if (rows.length > 0) {
       console.log(`First request details: ${JSON.stringify(rows[0])}`);
     }
 
     rows.forEach((req) => {
       console.log(
         `Request ID: ${req.request_id}, User: ${req.username}, Status: ${req.status}`
       );
     });
 
     // Format the response
     ctx.body = rows;
   } catch (err) {
     console.error("Error fetching all agent requests:", err);
     ctx.status = 500;
     ctx.body = { error: err.message };
   }
 });
 
 /**
  * Update an agent request status
  * Admin only - approves or rejects requests with optional feedback
  */
 router.put(
   "/:requestId/status",
   authMiddleware,
   requireRole(2),
   async (ctx) => {
     // Set CORS headers
     setCorsHeaders(ctx);
 
     try {
       const { requestId } = ctx.params;
       const { status } = ctx.request.body;
       const adminId = ctx.state.user.user_id;
 
       console.log(
         `Admin ${adminId} updating agent request ${requestId} to ${status}`
       );
 
       if (!["approved", "rejected"].includes(status)) {
         ctx.status = 400;
         ctx.body = {
           error: "Invalid status. Must be 'approved' or 'rejected'",
         };
         return;
       }
 
       // First, get the current request to make sure it exists and to get the user ID
       const [requests] = await pool.query(
         "SELECT * FROM agent_requests WHERE request_id = ?",
         [requestId]
       );
 
       if (requests.length === 0) {
         ctx.status = 404;
         ctx.body = { error: "Agent request not found" };
         return;
       }
 
       const request = requests[0];
       const userId = request.user_id;
 
       // Start a transaction to ensure both updates happen or neither happens
       const connection = await pool.getConnection();
       await connection.beginTransaction();
 
       try {
         // Update the agent request status
         await connection.query(
           "UPDATE agent_requests SET status = ?, response_date = NOW() WHERE request_id = ?",
           [status, requestId]
         );
 
         // If approved, update the user's role to agent (level 1)
         if (status === "approved") {
           await connection.query(
             "UPDATE users SET user_levels = 1 WHERE user_id = ? AND user_levels = 0",
             [userId]
           );
           console.log(`User ${userId} upgraded to agent role`);
         }
 
         await connection.commit();
 
         ctx.status = 200;
         ctx.body = {
           message: `Agent request ${status}`,
           request: {
             request_id: requestId,
             status,
             response_date: new Date(),
           },
         };
       } catch (error) {
         await connection.rollback();
         throw error;
       } finally {
         connection.release();
       }
     } catch (err) {
       console.error("Error updating agent request:", err);
       ctx.status = 500;
       ctx.body = { error: err.message };
     }
   }
 );
 
 module.exports = router;
 