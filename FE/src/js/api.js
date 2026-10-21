// All communication with the backend lives in this file.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    throw new Error(`Cannot reach the server. Is the backend running on ${API_BASE_URL}?`);
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new Error("The server sent an unreadable response");
  }

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.fieldErrors = data.errors || {}; // used by forms in a later step
    throw error;
  }
  return data;
}

export function checkHealth() {
  return request("/api/health");
}

// filters: { search, category, type, status, sort }  (empty values are skipped)
export async function getItems(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const result = await request(`/api/items${query ? `?${query}` : ""}`);
  return result.data;
}

export async function getStats() {
  const result = await request("/api/items/stats");
  return result.data;
}