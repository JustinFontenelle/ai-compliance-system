//=================================================
// Health Check Route
//================================================

const express = require("express");
const packageInfo = require("../package.json");

const router = express.Router();

// Health check endpoint

router.get("/health", (req, res) => {

  res.json({
  status: "ok",
  service: "ai-compliance-tool",
  version: packageInfo.version,
  environment: process.env.NODE_ENV || "development",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  requestId: req.requestId || null
});

});
// Export the router
module.exports = router;