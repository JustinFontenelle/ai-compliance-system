//=========================
// Metrics Service
//=========================

let metrics = {
  totalRequests: 0,
  totalErrors: 0
};

function incrementRequests() {
  metrics.totalRequests++;
}

function incrementErrors() {
  metrics.totalErrors++;
}

function getMetrics() {
  return metrics;
}

module.exports = {
  incrementRequests,
  incrementErrors,
  getMetrics
};