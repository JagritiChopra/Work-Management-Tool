import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

// ─── Error Transformers ──────────────────────────────────────────────────────

const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];
  return new AppError(`Duplicate value for field '${field}': "${value}". Please use another value.`, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${errors.join('. ')}`, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') return new AppError('File size too large.', 400);
  if (err.code === 'LIMIT_FILE_COUNT') return new AppError('Too many files uploaded at once.', 400);
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return new AppError('Unexpected file field.', 400);
  return new AppError(`File upload error: ${err.message}`, 400);
};

// ─── Response Senders ────────────────────────────────────────────────────────

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    logger.error('UNHANDLED ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─── Global Error Handler ────────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${req.method} ${req.originalUrl} - ${err.statusCode} - ${err.message}`, {
    ip: req.ip,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  if (error instanceof mongoose.Error.CastError) error = handleCastErrorDB(error);
  else if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  else if (error instanceof mongoose.Error.ValidationError) error = handleValidationErrorDB(error);
  else if (error.name === 'JsonWebTokenError') error = handleJWTError();
  else if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  else if (error.name === 'MulterError') error = handleMulterError(error);

  sendErrorProd(error, res);
};

export default errorHandler;
