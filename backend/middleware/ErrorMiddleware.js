const { AppError } = require("../Utilities/appError");
const logger = require("../Config/logger");
const config = require("../Config/index");

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors;

  // JWT errors
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  // Prisma errors
  if (err.code === "P2002") {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(", ")} already exists`;
  }
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error("Server Error", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.isDev && statusCode >= 500 && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404));
};

module.exports = { errorHandler, notFound };
