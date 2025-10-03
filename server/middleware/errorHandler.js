const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    return res.status(409).json({
      error: `${field} already exists`,
      field
    });
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference to related resource'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      maxSize: process.env.MAX_FILE_SIZE || '10MB'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: err.retryAfter
    });
  }

  // Custom application errors
  if (err.status) {
    return res.status(err.status).json({
      error: err.message
    });
  }

  // Default server error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
