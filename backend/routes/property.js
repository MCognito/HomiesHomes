const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const model = require("../models/property");

const router = new Router({ prefix: "/home/properties" });

router.get("/", getAll);
router.post("/", bodyParser(), createProperty);
router.get("/:id", getById);
router.put("/:id", bodyParser(), updateProperty);
router.del("/:id", deleteProperty);

// Get all properties
async function getAll(ctx) {
  let properties = await model.getAll();
  if (properties.length) {
    ctx.body = properties;
  }
}

async function getById(ctx) {
  let id = ctx.params.id;
  let property = await model.getById(id);
  if (property.length) {
    ctx.body = property[0];
  } else {
    ctx.status = 404;
    ctx.body = { message: "Property not found" };
  }
}

async function createProperty(ctx) {
  let body = ctx.request.body;
  let result = await model.addProperty(body);
  if (result.affectedRows > 0) {
    // Return the ID of the newly created property
    ctx.body = {
      message: "Property created successfully",
      id: result.insertId,
    };
    ctx.status = 201;
  } else {
    ctx.status = 400;
    ctx.body = { message: "Failed to create property" };
  }
}

async function updateProperty(ctx) {
  let id = ctx.params.id;
  let article = await model.getById(id);

  if (article.length === 0) {
    ctx.status = 404;
    ctx.body = { message: "Property not found" };
    return;
  }

  let body = ctx.request.body;
  let result = model.updateProperty(id, body);

  if (result.affectedRows > 0) {
    ctx.body = { message: "Property updated successfully" };
    ctx.status = 200;
  } else {
    ctx.status = 204;
    ctx.body = { message: "Property not found" };
  }
}

async function deleteProperty(ctx) {
  let id = ctx.params.id;
  let article = await model.getById(id);
  if (article.length === 0) {
    ctx.status = 404;
    ctx.body = { message: "Property not found" };
    return;
  }

  let result = model.deleteProperty(id);
  if (result.affectedRows > 0) {
    ctx.body = { message: "Property deleted successfully" };
    ctx.status = 200;
  } else {
    ctx.status = 204;
    ctx.body = { message: "Property not found" };
  }
}

module.exports = router;
