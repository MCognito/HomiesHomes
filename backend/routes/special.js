const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const router = new Router({ prefix: "/home" });

router.get("/", welcomeAPI);

function welcomeAPI(ctx) {
  ctx.body = {
    message: "Welcome to the HomiesHomes API",
  };
}

module.exports = router;
