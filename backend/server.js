require("dotenv").config();
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");

// Middleware
const errorHandler = require("./middlewares/errorHandler");
const { addHateoasLinks } = require("./middlewares/hateoas");
const corsOptionsDelegate = require("./middlewares/corsOptions");

// Routes
const usersRoutes = require("./routes/users");
const propertiesRoutes = require("./routes/properties");
const bookingsRoutes = require("./routes/bookings");
const favouritesRoutes = require("./routes/favourites");

// Config
const { port } = require("./config/env");

// Init app
const app = new Koa();

// Global error handler for uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  console.error("Stack trace:", err.stack);
  // Keep the process running but log the error
});

// Apply role-based CORS middleware
app.use(corsOptionsDelegate);

// Apply other middleware
app.use(errorHandler);
app.use(bodyParser());
app.use(addHateoasLinks); // Add HATEOAS links to responses

// 🚀 Mount Routes
app.use(usersRoutes.routes()).use(usersRoutes.allowedMethods());
app.use(propertiesRoutes.routes()).use(propertiesRoutes.allowedMethods());
app.use(bookingsRoutes.routes()).use(bookingsRoutes.allowedMethods());
app.use(favouritesRoutes.routes()).use(favouritesRoutes.allowedMethods());

// Check for 404s on unmatched routes
app.use((ctx) => {
  if (ctx.status === 404 || ctx.body === undefined) {
    ctx.status = 404;
    ctx.body = {
      message: "Endpoint not found",
      status: 404,
      path: ctx.path,
      method: ctx.method,
    };
  }
});

// Start server
try {
  const server = app.listen(port, () => {
    console.log(`🚀 Koa server running on port ${port}`);
    console.log(`CORS enabled with role-based header exposure`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
  });
} catch (err) {
  console.error("Failed to start server:", err);
}
