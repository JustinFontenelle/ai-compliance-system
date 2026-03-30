//=========================
// In-Memory Job Queue
// ========================

const {
  incrementRequests,
  startRequest,
  finishRequest,
  incrementErrors
} = require("./metricsService");

const processChecklist = require("./aiProcessing");

const JOB_TIMEOUT_MS = 10000; // 10 seconds timeout for AI processing

const jobs = {};

function generateJobId() {
  return Date.now().toString();
}

// ============================
// Enqueue a new job
// ============================

async function enqueueJob(data) {
  const jobId = generateJobId();

  incrementRequests();

console.log("START REQUEST");


// Create a new job entry
  jobs[jobId] = {
    status: 'pending',
    data,
    result: null,
    attempts: 0,
    maxAttempts: 3,
    error: null,
    requestId: data.requestId,
    progress: 'queued',
    createdAt: Date.now(),
  };

  console.log(`[JOB ${jobId}] [Request ${data.requestId}] Job created`);

  processJob(jobId);

  return jobId;
}

// ============================
// Process a job asynchronously
// ============================

async function processJob(jobId) {
  const job = jobs[jobId];

  job.status = 'processing';
  job.progress = 'starting';

  while (job.attempts < job.maxAttempts) {
    try {
      job.attempts++;

      console.log(`[JOB ${jobId}] [Request ${job.requestId}] Attempt ${job.attempts}`);

      job.progress = 'calling_ai';

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

      // ============================
      // SUCCESS
      // ============================

      job.progress = 'completed';
      job.result = result;
      job.status = 'completed';

      console.log("FINISH REQUEST (SUCCESS)");
     

      return;
     
      // ============================
      // FAILURE
      // ============================

    } catch (error) {
      job.error = `Attempt ${job.attempts}: ${error.message}`;

      console.log(
        `[JOB ${jobId}] [Request ${job.requestId}] Failed attempt ${job.attempts}: ${error.message}`
      );

      // ============================
      // FINAL FAILURE
      // ============================

      if (job.attempts >= job.maxAttempts) {
  console.log(`[JOB ${jobId}] Max attempts reached`);

  job.progress = 'failed';
  job.status = 'failed';

    console.log("FINISH REQUEST (FAILURE)");
  incrementErrors();
  

  return;
}

      // ============================
      // RETRY DELAY
      // ============================

      await delay(2000);
    }
  }
}

// ==========================
// Get job status and result
// ==========================

function getJob(jobId) {
  return jobs[jobId];
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