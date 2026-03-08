// ========================
// Authorize Request Middleware
// ========================

function authorizeRequest(req, res, next) {

  const apiKey = req.headers["x-api-key"];

  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {

    return res.status(403).json({
      status: "error",
      message: "Unauthorized request"
    });

  }

  next();
}

// ========================
// Export Middleware
// ========================

module.exports = authorizeRequest;