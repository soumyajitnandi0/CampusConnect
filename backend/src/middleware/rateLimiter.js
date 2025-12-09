const config = require('../config');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// Simple in-memory rate limiter (for production, use Redis)
const requestCounts = new Map();

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const max = config.rateLimit.max;

  // Clean up old entries periodically
  if (requestCounts.size > 10000) {
    const cutoff = now - windowMs;
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < cutoff) {
        requestCounts.delete(key);
      }
    }
  }

  const key = `${ip}-${req.path}`;
  const record = requestCounts.get(key);

  if (!record || record.resetTime < now) {
    // New window
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (record.count >= max) {
    logger.warn('Rate limit exceeded', { ip, path: req.path, count: record.count });
    throw new AppError('Too many requests, please try again later', 429);
  }

  record.count++;
  next();
};

module.exports = rateLimiter;


