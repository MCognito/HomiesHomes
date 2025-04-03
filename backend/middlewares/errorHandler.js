const errorHandler = async (ctx, next) => {
  try {
    await next();

    // Handle case where response is undefined
    if (ctx.status !== 204 && ctx.body === undefined) {
      ctx.status = 200;
      ctx.body = { status: "success" };
    }
  } catch (err) {
    console.error("Error caught in middleware:", err.stack);
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message || "Internal Server Error",
      status: ctx.status,
    };
  }
};

module.exports = errorHandler;
