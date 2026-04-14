const { workerClient } = require("../config/redisClient");
const processChecklist = require("../services/aiProcessing");
const logger = require("../utils/logger");

const STUCK_THRESHOLD_MS = 30000; // 30 seconds

async function startWorker() {
  console.log("Worker started...");

  setInterval(checkForStuckJobs, 10000); // every 10 seconds

  while (true) {
    try {
      const result = await workerClient.brPop("queue:jobs", 0);
      const jobId = result.element;

      console.log("Processing job:", jobId);

      let jobRaw = await workerClient.get(`job:${jobId}`);
      if (!jobRaw) continue;

      let job = JSON.parse(jobRaw);

      job.status = "processing";
      job.progress = "starting";
      job.startedAt = Date.now();
      job.lastUpdatedAt = Date.now();

      await workerClient.set(`job:${jobId}`, JSON.stringify(job));

      const MAX_ATTEMPTS = 3;
      const JOB_TIMEOUT_MS = 20000;

      let success = false;

      while (job.attempts < MAX_ATTEMPTS && !success) {
        try {
          job.attempts++;
          job.lastUpdatedAt = Date.now();

          await workerClient.set(`job:${jobId}`, JSON.stringify(job));

          logger.info("JOB_ATTEMPT", {
            jobId,
            attempt: job.attempts
          });

          const result = await Promise.race([
            processChecklist(
              job.data.text,
              job.data.requestId,
              job.data.clientIp
            ),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("AI timeout")), JOB_TIMEOUT_MS)
            )
          ]);

          job.status = "completed";
          job.progress = "completed";
          job.result = result;
          job.lastUpdatedAt = Date.now();

          await workerClient.set(`job:${jobId}`, JSON.stringify(job));

          logger.info("JOB_SUCCESS", {
            jobId,
            attempts: job.attempts
          });

          success = true;

        } catch (error) {
          job.error = `Attempt ${job.attempts}: ${error.message}`;
          job.lastUpdatedAt = Date.now();

          await workerClient.set(`job:${jobId}`, JSON.stringify(job));

          logger.error("JOB_FAILED_ATTEMPT", {
            jobId,
            attempt: job.attempts,
            error: error.message
          });

          if (job.attempts >= MAX_ATTEMPTS) {
            job.status = "failed";
            job.progress = "failed";
            job.lastUpdatedAt = Date.now();

            await workerClient.set(`job:${jobId}`, JSON.stringify(job));

            logger.error("JOB_FAILED_FINAL", {
              jobId,
              attempts: job.attempts,
              error: job.error
            });

            break;
          }

          await new Promise(res => setTimeout(res, 2000));
        }
      }

    } catch (err) {
      console.error("Worker error:", err);
    }
  }
}

async function checkForStuckJobs() {
  console.log("Checking for stuck jobs...");

  const keys = await workerClient.keys("job:*");

  for (const key of keys) {
    const jobRaw = await workerClient.get(key);
    if (!jobRaw) continue;

    const job = JSON.parse(jobRaw);

    if (job.status === "processing") {
      const now = Date.now();
      const lastUpdate = job.lastUpdatedAt || job.startedAt;

      if (now - lastUpdate > STUCK_THRESHOLD_MS) {
        console.log("STUCK JOB DETECTED:", key);

        // prevent infinite requeue loops
        job.requeueCount = job.requeueCount || 0;

        if (job.requeueCount >= 2) {
          console.log("JOB PERMANENTLY FAILED:", key);

          job.status = "failed";
          job.progress = "failed";
          job.error = "Exceeded requeue limit";
          job.lastUpdatedAt = Date.now();

          await workerClient.set(key, JSON.stringify(job));
          continue;
        }

        // requeue the job
        job.status = "pending";
        job.progress = "requeued";
        job.error = "Requeued after being stuck";
        job.lastUpdatedAt = Date.now();

        job.attempts = 0;
        job.requeueCount++;

        await workerClient.set(key, JSON.stringify(job));

        const jobId = key.split(":")[1];
        await workerClient.lPush("queue:jobs", jobId);

        console.log("REQUEUED STUCK JOB:", jobId);
      }
    }
  }
}

module.exports = { startWorker };