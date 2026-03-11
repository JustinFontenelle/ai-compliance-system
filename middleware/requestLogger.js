const logger = require("../utils/logger");

function requestLogger(req, res, next) {

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

module.exports = requestLogger;