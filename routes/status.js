// ========================
// Status Route
// ======================== 

// Status route to check job status and retrieve results

const express = require("express");
const router = express.Router();

// Services

const { getJob } = require("../services/queueService");

// Route Handler

router.get("/status/:jobId", async (req, res) => {
  const job = await getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({
    status: job.status,
    progress: job.progress,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    result: job.result || null,
    error: job.error || null
  });
});
// Export the router

module.exports = router;