// My Blog API

// Set up the application and its router

//const mySQL = require("mysql");
const Koa = require("koa");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

/*
 * Define route handler(s):
 *
 * This means we connect HTTP methods: GET, POST,...
 * and the URI paths: /some/uri/path
 * to JavaScript functions that handle the request
 *
 * Once defined we then add thme to the app object
 *
 */

router.get("/homes", welcomeAPI);
app.use(router.routes());

function welcomeAPI(ctx, next) {
  ctx.body = {
    message: [
      "Welcome to my Home Estate Agency API Server Test",
      "Any Changes I Make here will be reflected onto the website with a refresh",
    ],
  };
}

const houses = require("./backend/routes/houses");
app.use(houses.routes());

const bodyParser = require("koa-bodyparser");
app.use(bodyParser());

// Finally, run the app as a process on a given port

app.listen(3000);
