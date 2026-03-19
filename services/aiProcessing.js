// ========================
// Import Modules
// ========================

const buildComplianceContext = require("./complianceContextBuilder");
const logAuditEvent = require("./auditLogger");
const { OpenAI } = require("openai");

// ========================
// Initialize OpenAI Client
// ========================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ========================
// AI Processing Function
// ========================

async function processChecklist(policyText, requestId, clientIp) {

  // Audit Logging
  
  logAuditEvent(
    "AI_REQUEST_RECEIVED",
    { inputLength: policyText.length },
    requestId,
    clientIp
  );

  const context = buildComplianceContext(policyText);

let attempts = 0;
const maxAttempts = 2;

while (attempts < maxAttempts) {
  try {
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a compliance assistant.

Convert the input policy into a checklist with EXACTLY these 4 sections:

1. Storage Security
2. Access Control
3. Training Requirements
4. Breach Reporting

Rules:
- Always include all 4 sections
- Do not rename sections
- Do not add extra sections
- Each section must contain bullet checklist items
- Keep wording clear and consistent
`
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ]
    });

    const output = response.choices[0].message.content;

    // Validation
    if (
      !output.includes("Storage Security") ||
      !output.includes("Access Control") ||
      !output.includes("Training Requirements") ||
      !output.includes("Breach Reporting")
    ) {
      throw new Error("AI output validation failed");
    }

    return output;

  } catch (error) {

    attempts++;

    console.error(`Attempt ${attempts} failed:`, error.message);

    if (attempts >= maxAttempts) {
      throw new Error("AI service failed after retries");
    }
  }
}
}

// ========================
// Export Service
// ========================

module.exports = processChecklist;