//================================
//  Redis Client Configuration
//================================

const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://127.0.0.1:6379"
});

//separate client for worker
const workerClient = createClient({
  url: "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

workerClient.on("error", (err) => {
  console.error("Worker Redis Error", err);
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis client connected");
  }

  if (!workerClient.isOpen) {
    await workerClient.connect();
    console.log("Worker client connected");
  }
}

module.exports = {
  redisClient,
  workerClient,
  connectRedis
};