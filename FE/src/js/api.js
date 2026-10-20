// All communication with the backend lives in this file.
// Other files never call fetch() directly; they call functions from here.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Send a request and return the parsed JSON.
// Throws an Error with a readable message if anything goes wrong.
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    // fetch() itself failed: server is off, wrong URL, or blocked by CORS
    throw new Error(
      "Cannot reach the server. Is the backend running on " + API_BASE_URL + "?"
    );
  }

  const data = await response.json();

  // response.ok is false for status codes like 400, 404, 500
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function checkHealth() {
  return request("/api/health");
}