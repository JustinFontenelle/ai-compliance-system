function log(level, message, meta = {}) {

  const logEntry = {
    level,
    message,
    service: "ai-compliance-tool",
    timestamp: new Date().toISOString(),
    ...meta
  };

  console.log(JSON.stringify(logEntry));

}

module.exports = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta)
};