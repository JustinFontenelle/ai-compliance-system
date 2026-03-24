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

  const { jobId } = data;

  // Poll Until Job Completes
  
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

  while (attempts < maxAttempts) {
    const response = await fetch(`http://localhost:3000/status/${jobId}`);

    // Handle rate limiting by waiting before retrying

    if (response.status === 429) {
      await delay(4000); 
      continue;
    }

    const job = await response.json();

// job status and return result if completed

if (job.status === "processing") {
  const message = `${formatProgress(job.progress)}... (Attempt ${job.attempts} of ${job.maxAttempts})`;

  console.log(message);

  if (updateUI) {
    updateUI(message);
  }
}

    if (job.status === "completed") {
      return job.result;
    }

    
    if (job.status === "failed") {
  throw new Error(job.error || "Job failed");
  }
    attempts++;
    await delay(2000); 
  }

  throw new Error("Job timed out");
}


// ========================
// Small Utility: Delay
// ========================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ========================
// Small Utility: Format Progress
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