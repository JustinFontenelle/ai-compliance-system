// ========================
// Utilities
// ========================

const { logRequestEvent } = require("../utils/requestEvents");


// ========================
// Import Modules
// ========================

const express = require("express");
const router = express.Router();


// ========================
// Middleware
// ========================

const authorizeRequest = require("../middleware/authorizeRequest");
const validateRequest = require("../middleware/validateRequest");


// ========================
// Services / Processing
// ========================

const { enqueueJob } = require("../services/queueService");
const processChecklist = require("../services/aiProcessing");


// ========================
// Response Utilities
// ========================

const { formatSuccess, formatError } = require("../utils/responseFormatter");


// ========================
// Route Handler
// ========================

router.post(
  "/generate",
  authorizeRequest,
  validateRequest,
  async (req, res, next) => {

    logRequestEvent(req, "[ROUTE] Generate checklist request received");

    try {
      const jobId = await enqueueJob({
        text: req.body.text,
        requestId: req.requestId,
        clientIp: req.clientIp
      });
      res.status(202).json({
        jobId,
        status: "processing"
      });

    } catch (error) {
      next(error);
    }
  }
);

// ========================
// Export Router
// ========================

module.exports = router;