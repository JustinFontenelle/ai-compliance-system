//=========================
// Metrics Service
//=========================

const express = require("express");
const router = express.Router();

const { getMetrics } = require("../services/metricsService");

router.get("/metrics", (req, res) => {
  res.json(getMetrics());
});

//==========================
// Export Router
//==========================

module.exports = router;