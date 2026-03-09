// ========================
// Global Error Handler
// ========================

function errorHandler(err, req, res, next) {

  console.error("Unhandled error:", err);

  res.status(500).json({
    status: "error",
    message: "Internal server error"
  });

}

// ========================
// Export Middleware
// ========================

module.exports = errorHandler;