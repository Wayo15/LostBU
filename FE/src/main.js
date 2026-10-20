import { checkHealth } from "./js/api.js";

const statusElement = document.getElementById("js-status");
const apiStatusElement = document.getElementById("api-status");

statusElement.textContent = "JavaScript: loaded successfully ✔";

async function showApiStatus() {
  apiStatusElement.textContent = "Backend: connecting...";

  try {
    const result = await checkHealth();
    apiStatusElement.textContent = `Backend: ${result.message} ✔`;
  } catch (error) {
    apiStatusElement.textContent = `Backend: ${error.message}`;
  }
}

showApiStatus();