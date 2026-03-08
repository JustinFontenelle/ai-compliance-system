// ========================
// API Request Function
// ========================

export async function generateChecklist(text) {
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

  return data.data;
}