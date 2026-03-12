//=========================
// Load Environment Variables
//=========================

require("dotenv").config();

//=========================
// Import Modules
//========================= 

// External Modules

const express = require("express");
const cors = require("cors");

// Internal Modules

const config = require("./config/appConfig");
const generateRoute = require("./routes/generate");
const healthRoutes = require("./routes/health");
const debugRoutes = require("./routes/debugRoutes");
const metricsRoutes = require("./routes/metricsRoutes");

// Middleware

const requestTracker = require("./middleware/requestTracker");
const requestLogger = require("./middleware/requestLogger");
const rateLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");


// Utilities

const logger = require("./utils/logger");

//=========================
// Initialize Express App
//=========================

const app = express();

// Core Middleware

app.use(cors());
app.use(express.json());

// Static Frontend Files

app.use(express.static(__dirname));

// Request Tracking and Logging

app.use(requestTracker);
app.use(requestLogger);

// Rate Limiter

app.use(rateLimiter);

//=========================
// Routes
//=========================

app.use("/", generateRoute);
app.use("/", healthRoutes);
app.use("/debug", debugRoutes);
app.use("/metrics", metricsRoutes);

//=========================
// Global Error Handler
//========================= 

app.use(errorHandler);

//=========================
// Start Server
//=========================

app.listen(config.server.port, () => {
  logger.info("Server started", {
  port: config.server.port
  });
});
