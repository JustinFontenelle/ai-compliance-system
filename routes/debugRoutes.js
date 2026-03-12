const express = require("express");

const router = express.Router();

router.get("/system", (req, res) => {
  res.json({
    status: "debug",
    service: "AI Compliance Documentation Tool",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;