// ========================
// Import Dependencies
// ========================

const logger = require("../utils/logger");

// ========================
// Global Error Handler
// ========================

function errorHandler(err, req, res, next) {

  logger.error("Unhandled server error", {
    requestId: req.requestId,
    method: req.method,
    route: req.originalUrl,
    message: err.message,
    stack: err.stack
  });

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId
  });

}

module.exports = errorHandler;