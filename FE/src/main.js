import { getItems, getStats } from "./js/api.js";
import { itemCard, statCard, loadingState, emptyState, errorState } from "./js/components.js";

const statsElement = document.getElementById("stats");
const listElement = document.getElementById("item-list");
const countElement = document.getElementById("result-count");
const filtersForm = document.getElementById("filters");
const searchInput = document.getElementById("filter-search");
const clearButton = document.getElementById("clear-filters");

const SEARCH_DELAY_MS = 300;
let searchTimer = null;
let latestRequestId = 0; // used to ignore responses that arrive too late

// Read the current value of every filter control
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

// true when the user has narrowed the list in any way (sort does not count)
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

    // A newer request was started while we waited: drop this old answer
    if (requestId !== latestRequestId) return;

    if (items.length === 0) {
      countElement.textContent = "0 items found";
      listElement.innerHTML = hasActiveFilters(filters)
        ? emptyState(
            "No matching items",
            "Try a different keyword or remove some filters.",
            '<button class="btn btn--secondary" type="button" data-action="clear">Clear filters</button>'
          )
        : emptyState("No items yet", "Reports will appear here once they are submitted.");
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

// ---- Events ----

// Typing: wait until the user pauses, then search (debounce)
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadItems, SEARCH_DELAY_MS);
});

// Dropdowns: search immediately when changed
filtersForm.addEventListener("change", (event) => {
  if (event.target !== searchInput) loadItems();
});

// Pressing Enter in the search box must not reload the page
filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  loadItems();
});

clearButton.addEventListener("click", clearFilters);

// Buttons created dynamically (event delegation)
document.addEventListener("click", (event) => {
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