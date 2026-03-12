//=========================
// Metrics Service
//=========================

const express = require("express");
const { getMetrics } = require("../services/metricsService");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(getMetrics());
});


//==========================
// Export Router
//==========================

module.exports = router;
