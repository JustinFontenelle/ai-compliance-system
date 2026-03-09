// ========================
// Import Modules
// ========================

const buildComplianceContext = require("./complianceContextBuilder");
const logAuditEvent = require("./auditLogger");

// ========================
// AI Processing Function
// ========================

async function processChecklist(policyText) {

  const context = buildComplianceContext(policyText);

  // ================================
  // Audit Logging for AI Request
  // ================================

  logAuditEvent("AI_REQUEST_RECEIVED", {
    inputLength: policyText.length
  });

  // ================================
  // Temporary Mock Response (Replace with actual AI API call)
  // ================================
return `Compliance Checklist

- Ensure employees complete cybersecurity awareness training annually
- Verify devices use encrypted storage
- Confirm security incidents are reported within 24 hours`;

  // ================================
  // Process AI Response
  // ================================

 const data = await response.json();

if (!data.choices || !data.choices[0] || !data.choices[0].message) {
  throw new Error("Invalid AI response format");
}

return data.choices[0].message.content;

}
// ========================
// Export Service
// ========================

module.exports = processChecklist;