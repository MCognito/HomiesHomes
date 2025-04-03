/**
 * Documentation Server
 */

 const Koa = require("koa");
 const serve = require("koa-static");
 const mount = require("koa-mount");
 const app = new Koa();
 
 // Make our docs available at different paths
 app.use(mount("/", serve("./docs/openapi"))); // Homepage shows the docs
 app.use(mount("/openapi", serve("./docs/openapi"))); // Also available at /openapi
 app.use(mount("/schemas", serve("./schemas"))); // JSON schemas at /schemas
 
 // Use a separate port so it doesn't interfere with the main API
 const port = process.env.DOCS_PORT || 9030;
 
 app.listen(port);
 console.log(
   `\n📚 Documentation server running at https://gammacairo-deltareward-3000.codio-box.uk:${port}`
 );
 console.log(
   `📚 OpenAPI UI available at https://gammacairo-deltareward-3000.codio-box.uk:${port}`
 );
 console.log(
   `📚 OpenAPI spec available at https://gammacairo-deltareward-3000.codio-box.uk:${port}/schemas/openapi.yaml\n`
 );
 