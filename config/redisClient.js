//================================
//  Redis Client Configuration
//================================

const { createClient } = require("redis");

// redis connection settings
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Shared config
const redisConfig = {
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
};

const redisClient = createClient(redisConfig);

// Separate client for worker
const workerClient = createClient(redisConfig);

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

workerClient.on("error", (err) => {
  console.error("Worker Redis Error", err);
});

async function connectRedis() {
  console.log("Redis connecting...");

  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis client connected");
  }

  if (!workerClient.isOpen) {
    await workerClient.connect();
    console.log("Worker client connected");
  }

  console.log("Redis fully initialized");
}

module.exports = {
  redisClient,
  workerClient,
  connectRedis
};