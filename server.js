require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Routes
const generateRoute = require("./routes/generate");
const statusRoute = require("./routes/status");
const healthRoutes = require("./routes/health");
const debugRoutes = require("./routes/debugRoutes");
const metricsRoutes = require("./routes/metricsRoutes");

// Middleware
const requestTracker = require("./middleware/requestTracker");
const requestLogger = require("./middleware/requestLogger");
const rateLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

// Config / Utils
const config = require("./config/appConfig");
const logger = require("./utils/logger");

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(__dirname));

// Tracking middleware functions
app.use(requestTracker);
app.use(requestLogger);

// Rate limiting 
app.use("/generate", rateLimiter);
app.use("/status", rateLimiter);

// Routes
app.use("/", generateRoute);
app.use("/", statusRoute);
app.use("/", healthRoutes);
app.use("/debug", debugRoutes);
app.use("/", metricsRoutes);

// Error handler 
app.use(errorHandler);

// Start server
app.listen(config.server.port, () => {
  logger.info("Server started", {
    port: config.server.port
  });
});