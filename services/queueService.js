// services/queueService.js

const logger = require("../utils/logger");

const {
  incrementRequests,
  incrementErrors,
  recordFailure,
  getFailureCount,
  resetFailures
} = require("./metricsService");

const processChecklist = require("./aiProcessing");

const { redisClient } = require("../config/redisClient");

const JOB_TIMEOUT_MS = 20000;
const MAX_JOB_DURATION_MS = 15000;

function generateJobId() {
  return Date.now().toString();
}

// ============================
// Utility: Get Job from Redis
// ============================

async function getJob(jobId) {
  const job = await redisClient.get(`job:${jobId}`);
  return job ? JSON.parse(job) : null;
}

// ============================
// Utility: Save Job to Redis
// ============================

async function saveJob(jobId, job) {
  await redisClient.set(`job:${jobId}`, JSON.stringify(job));
}

// ============================
// Enqueue a new job
// ============================

async function enqueueJob(data) {
  console.log("ENQUEUE JOB CALLED");

  const jobId = generateJobId();

  incrementRequests();

  const job = {
    status: "pending",
    data,
    result: null,
    attempts: 0,
    maxAttempts: 3,
    error: null,
    requestId: data.requestId,
    progress: "queued",
    createdAt: Date.now()
  };

  //DEBUG START
  console.log("ABOUT TO SAVE JOB");

  await saveJob(jobId, job);

  console.log("JOB SAVED");
  //DEBUG END

  logger.info("JOB_CREATED", {
    requestId: data.requestId,
    jobId,
    attempts: 0,
    maxAttempts: 3
  });

  await redisClient.lPush("queue:jobs", jobId);

  console.log("JOB PUSHED TO QUEUE:", jobId);

  return jobId;
}

// ============================
// asynchronous job processing
// ============================

async function processJob(jobId) {
  let job = await getJob(jobId);

  if (!job) return;

  job.status = "processing";
  job.progress = "starting";
  job.startedAt = Date.now();

  await saveJob(jobId, job);

  logger.info("JOB_STARTED", {
    requestId: job.requestId,
    jobId
  });

  while (job.attempts < job.maxAttempts) {

    const duration = Date.now() - job.startedAt;

    if (duration > MAX_JOB_DURATION_MS) {
      job.status = "failed";
      job.progress = "stuck";

      await saveJob(jobId, job);

      logger.error("JOB_STUCK_DETECTED", {
        requestId: job.requestId,
        jobId,
        duration,
        attempts: job.attempts
      });

      incrementErrors();
      recordFailure();

      if (getFailureCount() >= 3) {
        logger.error("SYSTEM_ALERT_HIGH_FAILURE_RATE", {
          failureCount: getFailureCount()
        });
      }

      return;
    }

    try {
      job.attempts++;

      await saveJob(jobId, job);

      logger.info("JOB_ATTEMPT", {
        requestId: job.requestId,
        jobId,
        attempt: job.attempts
      });

      job.progress = "calling_ai";

      await saveJob(jobId, job);

      const result = await Promise.race([
        processChecklist(
          job.data.text,
          job.data.requestId,
          job.data.clientIp
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Job timed out")), JOB_TIMEOUT_MS)
        )
      ]);

      job.progress = "completed";
      job.result = result;
      job.status = "completed";

      await saveJob(jobId, job);

      logger.info("JOB_SUCCESS", {
        requestId: job.requestId,
        jobId,
        attempts: job.attempts,
        resultLength: result?.length || 0
      });

      resetFailures();

      return;

    } catch (error) {
      job.error = `Attempt ${job.attempts}: ${error.message}`;

      await saveJob(jobId, job);

      logger.error("JOB_FAILED_ATTEMPT", {
        requestId: job.requestId,
        jobId,
        attempt: job.attempts,
        error: error.message
      });

      if (job.attempts >= job.maxAttempts) {
        job.progress = "failed";
        job.status = "failed";

        await saveJob(jobId, job);

        logger.error("JOB_FAILED_FINAL", {
          requestId: job.requestId,
          jobId,
          attempts: job.attempts,
          error: job.error
        });

        incrementErrors();
        recordFailure();

        if (getFailureCount() >= 3) {
          logger.error("SYSTEM_ALERT_HIGH_FAILURE_RATE", {
            failureCount: getFailureCount()
          });
        }

        return;
      }

      await delay(2000);
    }
  }
}

// ==========================
// Utility: Delay
// ==========================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================
// Exported Functions
// ========================

module.exports = {
  enqueueJob,
  getJob
};