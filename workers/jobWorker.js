

const { workerClient } = require("../config/redisClient");
const processChecklist = require("../services/aiProcessing");
const logger = require("../utils/logger");

async function startWorker() {
  console.log("Worker started...");

  while (true) {
    try {
      // Wait for job (blocking call)
      const result = await workerClient.brPop("queue:jobs", 0);

      const jobId = result.element;

      console.log("Processing job:", jobId);

      let jobRaw = await workerClient.get(`job:${jobId}`);
      if (!jobRaw) continue;

      let job = JSON.parse(jobRaw);

      job.status = "processing";
      job.progress = "starting";
      job.startedAt = Date.now();

      await workerClient.set(`job:${jobId}`, JSON.stringify(job));

      try {
        const aiResult = await processChecklist(
          job.data.text,
          job.data.requestId,
          job.data.clientIp
        );

        job.status = "completed";
        job.progress = "completed";
        job.result = aiResult;

        await workerClient.set(`job:${jobId}`, JSON.stringify(job));

        logger.info("JOB_SUCCESS", {
          jobId
        });

      } catch (error) {
        job.status = "failed";
        job.progress = "failed";
        job.error = error.message;

        await workerClient.set(`job:${jobId}`, JSON.stringify(job));

        logger.error("JOB_FAILED", {
          jobId,
          error: error.message
        });
      }

    } catch (err) {
      console.error("Worker error:", err);
    }
  }
}

module.exports = { startWorker };