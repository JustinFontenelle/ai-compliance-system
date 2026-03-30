// ========================
// Generate Checklist
// ========================

export async function generateChecklist(text) {

  // ========================
  // Send Request to Generate Endpoint
  // ========================

  const response = await fetch("http://localhost:3000/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "super-secret-key"
    },
    body: JSON.stringify({ text })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  // ========================
  // Store Job ID in Local Storage
  // ========================

  const { jobId } = data;
  localStorage.setItem("jobId", jobId);

  // ========================
  // Poll Until Job Completes
  // ========================

  return await pollForCompletion(jobId, (message) => {
    const output = document.getElementById("output");
    output.textContent = message;
  });
}


// ========================
// Resume Existing Job
// ========================

export async function generateChecklistFromJobId(jobId) {
  return await pollForCompletion(jobId, (message) => {
    const output = document.getElementById("output");
    output.textContent = message;
  });
}


// ========================
// Polling Function to Check Job Status
// ========================

async function pollForCompletion(jobId, updateUI) {
  let attempts = 0;
  const maxAttempts = 10;

  while (true) {

    // ========================
    // Timeout Protection
    // ========================

    if (attempts >= maxAttempts) {
      localStorage.removeItem("jobId");
      throw new Error("Job timed out");
    }

    const response = await fetch(`http://localhost:3000/status/${jobId}`);

    // ========================
    // Handle Rate Limiting
    // ========================

    if (response.status === 429) {
      attempts++;
      await delay(4000);
      continue;
    }

    const job = await response.json();

    // ========================
    // Processing State
    // ========================

    if (job.status === "processing") {
      const message = `${formatProgress(job.progress)}... (Attempt ${job.attempts} of ${job.maxAttempts})`;

      console.log(message);

      if (updateUI) {
        updateUI(message);
      }
    }

    // ========================
    // Completed State
    // ========================

    if (job.status === "completed") {
      localStorage.removeItem("jobId");
      return job.result;
    }

    // ========================
    // Failed State
    // ========================

    if (job.status === "failed") {
      localStorage.removeItem("jobId");
      const errorMessage = job.error || "Job failed";
      throw new Error(errorMessage);
    }

    // ========================
    // Continue Polling
    // ========================

    attempts++;
    await delay(2000);
  }
}


// ========================
// Utility: Delay
// ========================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ========================
// Utility: Format Progress
// ========================

function formatProgress(p) {
  switch (p) {
    case "starting": return "Starting request";
    case "calling_ai": return "Calling AI service";
    case "formatting": return "Formatting checklist";
    case "completed": return "Completed";
    case "failed": return "Failed";
    default: return p;
  }
}