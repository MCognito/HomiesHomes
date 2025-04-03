/**
 * HomiesHomes API Server
 * Starting point for our real estate web application
 */

// Core packages we need
const Koa = require("koa");
const Router = require("koa-router");

// Create app and router
const app = new Koa();
const router = new Router();

/**
 * Set up  routes
 *
 * Each route connects a URL path to a JavaScript function
 * that will handle the request and send back a response
 */

// Simple welcome endpoint
router.get("/homes", welcomeAPI);
app.use(router.routes());

// A basic welcome message to verify the API is running
function welcomeAPI(ctx, next) {
  ctx.body = {
    message: [
      "Welcome to my Home Estate Agency API Server Test",
      "Any Changes I Make here will be reflected onto the website with a refresh",
    ],
  };
}

// Connect property routes
const houses = require("./backend/routes/houses");
app.use(houses.routes());

// Add middleware to parse request bodies
const bodyParser = require("koa-bodyparser");
app.use(bodyParser());

// Start the server on port 3000
app.listen(3000);
