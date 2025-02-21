// Description: This file is the entry point for the application.

const Koa = require("koa");

const app = new Koa();

const special = require("./routes/special.js");
const property = require("./routes/property.js");

app.use(special.routes());
app.use(property.routes());

let port = process.env.PORT || 3000;

app.listen(port);
