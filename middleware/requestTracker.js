// ========================
// Import Request ID Generator
// ========================

const generateRequestId = require("../utils/requestId");

// ========================
// Request Tracking Middleware
// ========================

function requestTracker(req, res, next) {

  const requestId = generateRequestId();

  req.requestId = requestId;
  req.clientIp = req.ip;

  console.log(`[Request ${requestId}] Incoming request`);

  next();

}

module.exports = requestTracker;