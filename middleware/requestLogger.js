//=========================
// Request Logger Middleware
//=========================

const logger = require("../utils/logger");
const { incrementRequests } = require("../services/metricsService");

// Logs details of each incoming HTTP request and its response

function requestLogger(req, res, next) {

  //==========================
  // Metrics Tracking
  //==========================

  incrementRequests();

  const start = Date.now();

  res.on("finish", () => {

    const duration = Date.now() - start;

    logger.info("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration
    });

  });

  next();
}

//==========================
// Export Middleware
//==========================

module.exports = requestLogger;