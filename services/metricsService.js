//=========================
// Metrics Service
//=========================

let metrics = {
  totalRequests: 0,
  totalErrors: 0,
  totalLatency: 0
};

// Service functions to update and retrieve metrics

function incrementRequests() {
  metrics.totalRequests++;
}

function incrementErrors() {
  metrics.totalErrors++;
}

function getMetrics() {

  const averageLatency =
    metrics.totalRequests > 0
      ? metrics.totalLatency / metrics.totalRequests
      : 0;

  return {
    ...metrics,
    averageLatency
  };

}

function recordLatency(duration) {
  metrics.totalLatency += duration;
}

// Export the service functions

module.exports = {
  incrementRequests,
  incrementErrors,
  recordLatency,
  getMetrics
};