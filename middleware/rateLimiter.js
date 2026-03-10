// ========================
// Simple In Memory Rate Limiter
// ========================

const requestCounts = {};

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

function rateLimiter(req, res, next) {

  const ip = req.ip;
  const now = Date.now();

  if (!requestCounts[ip]) {
    requestCounts[ip] = [];
  }

  // Remove old requests outside the window
  
  requestCounts[ip] = requestCounts[ip].filter(
    timestamp => now - timestamp < WINDOW_MS
  );

  if (requestCounts[ip].length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please try again later."
    });
  }

  requestCounts[ip].push(now);

  next();
}

module.exports = rateLimiter;