import { getItems, getStats } from "./js/api.js";
import { itemCard, statCard, loadingState, emptyState, errorState } from "./js/components.js";

const statsElement = document.getElementById("stats");
const listElement = document.getElementById("item-list");

async function loadStats() {
  try {
    const stats = await getStats();
    statsElement.innerHTML =
      statCard("Lost items", stats.Lost, "lost") +
      statCard("Found items", stats.Found, "found") +
      statCard("Returned items", stats.Returned, "returned");
  } catch (error) {
    // The cards are secondary: if they fail, hide them. The list shows the real error.
    statsElement.innerHTML = "";
  }
}

async function loadItems() {
  listElement.innerHTML = loadingState("Loading items...");
  try {
    const items = await getItems({ sort: "newest" });
    if (items.length === 0) {
      listElement.innerHTML = emptyState("No items yet", "Reports will appear here once they are submitted.");
      return;
    }
    listElement.innerHTML = items.map(itemCard).join("");
  } catch (error) {
    listElement.innerHTML = errorState(error.message);
  }
}

// One click listener handles every "Try again" button (event delegation)
document.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="retry"]')) {
    loadStats();
    loadItems();
  }
});

loadStats();
loadItems();