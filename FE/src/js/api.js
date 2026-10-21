// All communication with the backend lives in this file.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
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
    error.fieldErrors = data.errors || {}; // shown next to form fields
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

// formData: a FormData object (text fields + optional "image" file).
// Do NOT set Content-Type: the browser adds it with the multipart boundary.
export async function createItem(formData) {
  const result = await request("/api/items", { method: "POST", body: formData });
  return result.data;
}

// The database stores a path like "/uploads/abc.png". Turn it into a full URL.
export function imageSrc(imageUrl) {
  return imageUrl ? `${API_BASE_URL}${imageUrl}` : null;
}