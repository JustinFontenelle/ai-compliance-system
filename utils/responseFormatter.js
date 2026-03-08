// ========================
// Success Response Formatter
// ========================

function formatSuccess(data) {
  return {
    status: "success",
    data: data
  };
}

// ========================
// Error Response Formatter
// ========================

function formatError(message) {
  return {
    status: "error",
    message: message
  };
}

// ========================
// Export Functions
// ========================

module.exports = {
  formatSuccess,
  formatError
};