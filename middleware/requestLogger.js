//=========================
// Request Logger Middleware
//=========================

const logger = require("../utils/logger");

const {
  recordLatency,
  startRequest,
  finishRequest
} = require("../services/metricsService");

//=========================
// Middleware Function
//=========================

function requestLogger(req, res, next) {

  // Start tracking request time and metrics
  startRequest();

  const start = Date.now();

  let finished = false;

  const done = () => {
    if (finished) return;
    finished = true;

    const duration = Date.now() - start;

    if (duration > 2000) {
      logger.warn("High latency detected", {
        requestId: req.requestId,
        duration_ms: duration,
        route: req.originalUrl
      });
    }

    finishRequest();
    recordLatency(duration);

    logger.info("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration
    });
  };

  // listen for response finish or close events
  res.on("finish", done);
  res.on("close", done);

  next();
}

//=========================
// Export Middleware
//=========================

module.exports = requestLogger;