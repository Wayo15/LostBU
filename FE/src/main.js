import { getItems, getStats } from "./js/api.js";
import { itemCard, statCard, loadingState, emptyState, errorState } from "./js/components.js";
import { openReportForm, setOnSuccess } from "./js/form.js";
import { openDetails, setOnChange } from "./js/details.js";

const statsElement = document.getElementById("stats");
const listElement = document.getElementById("item-list");
const countElement = document.getElementById("result-count");
const filtersForm = document.getElementById("filters");
const searchInput = document.getElementById("filter-search");
const clearButton = document.getElementById("clear-filters");
const toastElement = document.getElementById("toast");

const SEARCH_DELAY_MS = 300;
let searchTimer = null;
let toastTimer = null;
let latestRequestId = 0;

function showToast(message) {
  toastElement.textContent = message;
  toastElement.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastElement.hidden = true), 5000);
}

function readFilters() {
  const data = new FormData(filtersForm);
  return {
    search: String(data.get("search") || "").trim(),
    category: data.get("category"),
    type: data.get("type"),
    status: data.get("status"),
    sort: data.get("sort"),
  };
}

function hasActiveFilters(filters) {
  return Boolean(filters.search || filters.category || filters.type || filters.status);
}

async function loadStats() {
  try {
    const stats = await getStats();
    statsElement.innerHTML =
      statCard("Lost items", stats.Lost, "lost") +
      statCard("Found items", stats.Found, "found") +
      statCard("Returned items", stats.Returned, "returned");
  } catch (error) {
    statsElement.innerHTML = "";
  }
}

async function loadItems() {
  const requestId = ++latestRequestId;
  const filters = readFilters();

  listElement.innerHTML = loadingState("Loading items...");
  countElement.textContent = "";

  try {
    const items = await getItems(filters);
    if (requestId !== latestRequestId) return;

    if (items.length === 0) {
      countElement.textContent = "0 items found";
      listElement.innerHTML = hasActiveFilters(filters)
        ? emptyState(
            "No matching items",
            "Try a different keyword or remove some filters.",
            '<button class="btn btn--secondary" type="button" data-action="clear">Clear filters</button>'
          )
        : emptyState("No items yet", "Be the first to report a lost or found item.");
      return;
    }

    countElement.textContent = `${items.length} ${items.length === 1 ? "item" : "items"} found`;
    listElement.innerHTML = items.map(itemCard).join("");
  } catch (error) {
    if (requestId !== latestRequestId) return;
    countElement.textContent = "";
    listElement.innerHTML = errorState(error.message);
  }
}

function clearFilters() {
  filtersForm.reset();
  loadItems();
}

// New report: clear filters so the new item is visible
setOnSuccess((item) => {
  filtersForm.reset();
  loadStats();
  loadItems();
  showToast(`"${item.name}" was reported as ${item.type.toLowerCase()}. Thank you!`);
});

// Status change, edit or delete: refresh but KEEP the user's filters
setOnChange((message) => {
  loadStats();
  loadItems();
  showToast(message);
});

// ---- Events ----

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadItems, SEARCH_DELAY_MS);
});

filtersForm.addEventListener("change", (event) => {
  if (event.target !== searchInput) loadItems();
});

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  loadItems();
});

clearButton.addEventListener("click", clearFilters);

document.addEventListener("click", (event) => {
  const reportButton = event.target.closest("[data-report]");
  if (reportButton) openReportForm(reportButton.dataset.report);

  const itemButton = event.target.closest("[data-item-id]");
  if (itemButton) openDetails(itemButton.dataset.itemId);

  if (event.target.closest('[data-action="retry"]')) {
    loadStats();
    loadItems();
  }
  if (event.target.closest('[data-action="clear"]')) {
    clearFilters();
  }
});

loadStats();
loadItems();