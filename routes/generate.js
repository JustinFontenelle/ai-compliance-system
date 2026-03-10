
// ========================
// Import Modules
// ========================

const express = require("express");
const router = express.Router();

// Middleware

const authorizeRequest = require("../middleware/authorizeRequest");
const validateRequest = require("../middleware/validateRequest");

// Processing

const processChecklist = require("../services/aiProcessing");
const { formatSuccess, formatError } = require("../utils/responseFormatter");

// ========================
// Route Handler
// ========================

router.post("/generate", authorizeRequest, validateRequest, async (req, res, next) => {

  const result = await processChecklist(
  req.body.text,
  req.requestId,
  req.clientIp
);

  res.json(formatSuccess(result));

});

// ========================
// Export the router
// ========================

module.exports = router;