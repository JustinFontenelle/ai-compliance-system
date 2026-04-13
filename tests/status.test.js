process.env.INTERNAL_API_KEY = "test-key";

// ========================
// MOCKS (First)
// ========================

jest.mock("../services/queueService", () => {
  let jobStore = {};

  return {
    enqueueJob: jest.fn(async () => {
      const jobId = "job-123";

      jobStore[jobId] = {
        status: "processing",
        progress: "starting",
        attempts: 1,
        maxAttempts: 3,
        result: null,
        error: null
      };

      // async state change
      setTimeout(() => {
        jobStore[jobId] = {
          status: "completed",
          progress: "completed",
          attempts: 1,
          maxAttempts: 3,
          result: "Mock checklist result",
          error: null
        };
      }, 100);

      return jobId;
    }),

    getJob: jest.fn((jobId) => {
      return jobStore[jobId];
    })
  };
});

// Silence logs
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// ========================
// IMPORTS
// ========================

const request = require("supertest");
const express = require("express");

const generateRoute = require("../routes/generate");
const statusRoute = require("../routes/status");

// ========================
// APP SETUP
// ========================

const app = express();
app.use(express.json());

app.use("/", generateRoute);
app.use("/", statusRoute);

// ========================
// TEST
// ========================

describe("Async Job Lifecycle", () => {

  it("should transition from processing → completed", async () => {

    // 1. Create job
    const createRes = await request(app)
      .post("/generate")
      .set("x-api-key", "test-key")
      .send({ text: "Test policy text" });

    expect(createRes.statusCode).toBe(202);

    const jobId = createRes.body.jobId;

    // 2. Initial status (processing)
    const status1 = await request(app)
      .get(`/status/${jobId}`);

    expect(status1.statusCode).toBe(200);
    expect(status1.body.status).toBe("processing");

    // 3. Wait for async completion
    await new Promise(resolve => setTimeout(resolve, 150));

    // 4. Final status (completed)
    const status2 = await request(app)
      .get(`/status/${jobId}`);

    expect(status2.statusCode).toBe(200);
    expect(status2.body.status).toBe("completed");
    expect(status2.body.result).toBe("Mock checklist result");

  });

});

it("should handle multiple rapid status checks correctly", async () => {
  const createRes = await request(app)
    .post("/generate")
    .set("x-api-key", "test-key")
    .send({ text: "Test policy text" });

  const jobId = createRes.body.jobId;

  // Firing multiple requests quickly
  const responses = await Promise.all([
    request(app).get(`/status/${jobId}`),
    request(app).get(`/status/${jobId}`),
    request(app).get(`/status/${jobId}`)
  ]);

  // All should be valid responses
  responses.forEach(res => {
    expect(res.statusCode).toBe(200);
    expect(["processing", "completed"]).toContain(res.body.status);
  });
});
it("should not return completed too early", async () => {
  const createRes = await request(app)
    .post("/generate")
    .set("x-api-key", "test-key")
    .send({ text: "Test policy text" });

  const jobId = createRes.body.jobId;

  // Wait (less) than completion time
  await new Promise(resolve => setTimeout(resolve, 50));

  const res = await request(app).get(`/status/${jobId}`);

  // It should still be processing
  expect(res.body.status).toBe("processing");
});
it("should handle repeated polling until completion", async () => {
  const createRes = await request(app)
    .post("/generate")
    .set("x-api-key", "test-key")
    .send({ text: "Test policy text" });

  const jobId = createRes.body.jobId;

  let finalStatus = null;

  // Simulate polling loop 
  for (let i = 0; i < 5; i++) {
    const res = await request(app).get(`/status/${jobId}`);

    if (res.body.status === "completed") {
      finalStatus = res.body;
      break;
    }

    // wait between polls
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  expect(finalStatus).not.toBeNull();
  expect(finalStatus.status).toBe("completed");
  expect(finalStatus.result).toBe("Mock checklist result");
});
it("should handle job failure correctly", async () => {
  // Override mock behavior for this test to simulate failure
  const queueService = require("../services/queueService");

  queueService.enqueueJob.mockImplementationOnce(async () => {
    const jobId = "job-fail";

    queueService.getJob.mockImplementation((id) => {
      if (id === jobId) {
        return {
          status: "failed",
          progress: "failed",
          attempts: 3,
          maxAttempts: 3,
          result: null,
          error: "AI processing failed"
        };
      }
    });

    return jobId;
  });

  const createRes = await request(app)
    .post("/generate")
    .set("x-api-key", "test-key")
    .send({ text: "Bad input" });

  const jobId = createRes.body.jobId;

  const statusRes = await request(app)
    .get(`/status/${jobId}`);

  expect(statusRes.statusCode).toBe(200);
  expect(statusRes.body.status).toBe("failed");
  expect(statusRes.body.error).toBe("AI processing failed");
});
it("should reflect retry attempts before failing", async () => {
  const queueService = require("../services/queueService");

  let attemptCount = 0;

  queueService.enqueueJob.mockImplementationOnce(async () => {
    const jobId = "job-retry";

    queueService.getJob.mockImplementation((id) => {
      if (id === jobId) {
        attemptCount++;

        if (attemptCount < 3) {
          return {
            status: "processing",
            progress: "calling_ai",
            attempts: attemptCount,
            maxAttempts: 3,
            result: null,
            error: null
          };
        }

        return {
          status: "failed",
          progress: "failed",
          attempts: 3,
          maxAttempts: 3,
          result: null,
          error: "Max retries reached"
        };
      }
    });

    return jobId;
  });

  const createRes = await request(app)
    .post("/generate")
    .set("x-api-key", "test-key")
    .send({ text: "Retry scenario" });

  const jobId = createRes.body.jobId;

  // First check
  const res1 = await request(app).get(`/status/${jobId}`);
  expect(res1.body.status).toBe("processing");
  expect(res1.body.attempts).toBe(1);

  // Second check
  const res2 = await request(app).get(`/status/${jobId}`);
  expect(res2.body.status).toBe("processing");
  expect(res2.body.attempts).toBe(2);

  // Third check (failure)
  const res3 = await request(app).get(`/status/${jobId}`);
  expect(res3.body.status).toBe("failed");
  expect(res3.body.attempts).toBe(3);
  expect(res3.body.error).toBe("Max retries reached");
});
it("should handle a job that never completes (stuck processing)", async () => {
  const queueService = require("../services/queueService");

  queueService.enqueueJob.mockImplementationOnce(async () => {
    const jobId = "job-stuck";

    queueService.getJob.mockImplementation((id) => {
      if (id === jobId) {
        return {
          status: "processing",
          progress: "calling_ai",
          attempts: 2,
          maxAttempts: 3,
          result: null,
          error: null
        };
      }
    });

    return jobId;
  });

  const createRes = await request(app)
    .post("/generate")
    .set("x-api-key", "test-key")
    .send({ text: "Stuck scenario" });

  const jobId = createRes.body.jobId;

  // Poll multiple times
  const responses = [];

  for (let i = 0; i < 3; i++) {
    const res = await request(app).get(`/status/${jobId}`);
    responses.push(res.body.status);
  }

  // reinforce  processing
  responses.forEach(status => {
    expect(status).toBe("processing");
  });
});