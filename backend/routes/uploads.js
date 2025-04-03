const Router = require("koa-router");
const koaBody = require("koa-body");
const fs = require("fs");
const path = require("path");

const router = new Router({ prefix: "/upload" });

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// POST /upload - image uploader
router.post("/", koaBody({ multipart: true }), async (ctx) => {
  const { image } = ctx.request.files || {};

  if (!image) {
    ctx.status = 400;
    ctx.body = { message: "No image file provided" };
    return;
  }

  const fileExt = path.extname(image.name);
  const uniqueName = `${Date.now()}-${Math.round(
    Math.random() * 1e5
  )}${fileExt}`;
  const savePath = path.join(uploadDir, uniqueName);
  const publicUrl = `/uploads/${uniqueName}`;

  try {
    const reader = fs.createReadStream(image.path);
    const writer = fs.createWriteStream(savePath);
    reader.pipe(writer);

    ctx.body = { imageUrl: publicUrl };
  } catch (err) {
    console.error("Upload failed:", err);
    ctx.status = 500;
    ctx.body = { message: "Failed to save image" };
  }
});

module.exports = router;
