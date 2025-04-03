/**
 * Main application entry point
 * Sets up the API server with all required routes
 */

const Koa = require("koa");
const app = new Koa();

// Load all our route modules
const usersRoutes = require("./routes/users");
const propertyRoutes = require("./routes/properties");
const agentRequestsRoutes = require("./routes/agent-requests");
const favouritesRoutes = require("./routes/favourites");
const bookingRoutes = require("./routes/bookings");

// Hook up the routes to our app
app.use(usersRoutes.routes());
app.use(propertyRoutes.routes());
app.use(agentRequestsRoutes.routes());
app.use(favouritesRoutes.routes());
app.use(bookingRoutes.routes());

// Skip server start during tests
if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3000);
}

module.exports = app;
