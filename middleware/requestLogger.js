//=========================
// Request Logger Middleware
//=========================

// Utilities
const logger = require("../utils/logger");

// Metrics Service
const {
  incrementRequests,
  recordLatency,
  startRequest,
  finishRequest
} = require("../services/metricsService");


//=========================
// Middleware Function
//=========================

// request details, recording, observability metrics

function requestLogger(req, res, next) {

  //==========================
  // Request Start Tracking
  //==========================
  
  // Track traffic and concurrency

  startRequest();        // concurrency +1
  incrementRequests();   // total request counter

  const start = Date.now();


  //==========================
  // Response Completion 
  //==========================
  

  res.on("finish", () => {

    const duration = Date.now() - start;
    
    // Log high latency requests for performance monitoring
    if (duration > 2000) {
  logger.warn("High latency detected", {
    requestId: req.requestId,
    duration_ms: duration,
    route: req.originalUrl
  });
}

    //==========================
    // Metrics Tracking
    //==========================

    finishRequest();          // concurrency -1
    recordLatency(duration);  // performance metric


    //==========================
    // Structured Request Log
    //==========================

    logger.info("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration
    });

  });


  //==========================
  // Continue Middleware Chain
  //==========================

  next();
}


//=========================
// Export Middleware
//=========================

module.exports = requestLogger;