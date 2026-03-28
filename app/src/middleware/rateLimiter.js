import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const createLimiter = (options) =>
  rateLimit({
    windowMs: options.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) ?? 15 * 60 * 1000,
    max: options.max,
    message: { status: 'fail', message: options.message ?? 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development', // ← add this
    handler: (req, res, next, opts) => {
      logger.warn(`Rate limit exceeded: ${req.ip} → ${req.originalUrl}`);
      res.status(429).json(opts.message);
    },
  });

// General API limiter
export const globalLimiter = createLimiter({
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: 'Too many requests from this IP, please try again in 15 minutes.',
});

// Strict limiter for auth endpoints
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

// Password reset: very strict
export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again in 1 hour.',
});

// Upload limiter
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Upload limit reached. Please try again in 1 hour.',
});
