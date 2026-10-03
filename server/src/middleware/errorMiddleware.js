const { errorResponse } = require('../utils/apiResponse');

exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication failed';
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('ERROR 💥', err);
  }

  return errorResponse(res, message, statusCode, errors);
};
