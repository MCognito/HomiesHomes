const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const authMiddleware = async (ctx, next) => {
  const authHeader = ctx.headers['authorization'];
  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { message: 'Authentication token required' };
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    ctx.state.user = payload;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { message: 'Invalid token' };
  }
};

const requireRole = (minLevel) => {
  return async (ctx, next) => {
    if (!ctx.state.user || ctx.state.user.user_levels < minLevel) {
      ctx.status = 403;
      ctx.body = { message: 'Insufficient privileges' };
      return;
    }
    await next();
  };
};

module.exports = { authMiddleware, requireRole };
