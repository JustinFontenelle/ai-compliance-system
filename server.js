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
const requestTracker = require("./middleware/requestTracker");
const rateLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

//=========================
// Initialize Express App
//=========================

const app = express();

// Core Middleware

app.use(cors());
app.use(express.json());

// Static Frontend Files

app.use(express.static(__dirname));

// Request tracking

app.use(requestTracker);

// Rate Limiter

app.use(rateLimiter);

//=========================
// Routes
//=========================

app.use("/", generateRoute);

//=========================
// Global Error Handler
//========================= 

app.use(errorHandler);

//=========================
// Start Server
//=========================

app.listen(config.server.port, () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
});
