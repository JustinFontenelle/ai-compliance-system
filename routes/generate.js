
// ========================
// Import Modules
// ========================

const express = require("express");
const router = express.Router();

// Middleware

const validateRequest = require("../middleware/validateRequest");
const authorizeRequest = require("../middleware/authorizeRequest");

// Processing

const processChecklist = require("../services/aiProcessing");
const { formatSuccess, formatError } = require("../utils/responseFormatter");

// ========================
// Route Handler
// ========================

router.post("/generate", authorizeRequest, validateRequest, async (req, res) => {

  try {

    const result = await processChecklist(req.body.text);

    // Success response

    res.json(formatSuccess(result));

  } catch (error) {

    console.error("AI processing error:", error);

    // Error response
    
    res.status(500).json(formatError("AI processing failed"));

  }

});

// ========================
// Export the router
// ========================

module.exports = router;