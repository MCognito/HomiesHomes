const Router = require("koa-router");

const bodyParser = require("koa-bodyparser");

const router = new Router({ prefix: "/homes/houses" });

router.use(bodyParser());

let houses = [
  {
    title: "hello House",
    fullTextField: "some text here to fill the body",
    dateCreated: Date(),
    timeCreated: Date.now(),
    dateEdited: null,
    views: 0,
  },

  {
    title: "another House",
    fullTextField: "again here is some text here to fill",
    dateCreated: Date(),
    timeCreated: Date.now(),
    dateEdited: null,
    views: 0,
  },

  {
    title: "coventry university",
    fullTextField: "some news about coventry university",
    dateCreated: Date(),
    timeCreated: Date.now(),
    dateEdited: null,
    views: 0,
  },
];

// Define routes without inline regex in the path
router.get("/", getAll);
router.post("/", createHouse);

// Apply the validation middleware for routes expecting an ID
router.get("/:id", getById);
router.put("/:id", updateHouse);
router.del("/:id", deleteHouse);

function getAll(ctx) {
  for (let i = 0; i < houses.length; i++) {
    houses[i].views += 1;
  }
  ctx.body = houses;
}

function getById(ctx) {
  let id = parseInt(ctx.params.id);
  if (id > 0 && id <= houses.length) {
    houses[id - 1].views += 1;
    ctx.body = houses[id - 1];
  } else {
    ctx.status = 404;
    ctx.body = { error: "House not found" };
  }
}

function createHouse(ctx) {
  let { title, fullTextField } = ctx.request.body;
  let newHouse = {
    title,
    fullTextField,
    dateCreated: Date(),
    timeCreated: Date.now(),
    dateEdited: null,
    views: 0,
  };

  houses.push(newHouse);
  ctx.status = 201;
  ctx.body = newHouse;
}

function updateHouse(ctx, next) {
  let id = parseInt(ctx.params.id);
  if (id > 0 && id <= houses.length) {
    try {
      let { title, fullTextField } = ctx.request.body;
      houses[id - 1] = {
        title,
        fullTextField,
        dateCreated: houses[id - 1].dateCreated,
        timeCreated: houses[id - 1].timeCreated,
        dateEdited: Date(),
        views: 0,
      };

      ctx.status = 200;
      ctx.body = {
        message: "House updated successfully",
        House: houses[id - 1],
      };
    } catch {
      ctx.status = 404;
      ctx.body = { message: "House not found" };
    }
  } else {
    ctx.status = 404;
    ctx.body = { message: "House not found" };
  }
}

function deleteHouse(ctx, next) {
  let id = parseInt(ctx.params.id);
  if (id > 0 && id <= houses.length) {
    houses.splice(id - 1, 1);
    ctx.body = { message: "House deleted successfully" };
    ctx.status = 200;
  } else {
    ctx.status = 204;
    ctx.body = { message: "House not found" };
  }
}

module.exports = router;
