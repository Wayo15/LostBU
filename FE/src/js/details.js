// Detail dialog: show one item, change its status, edit it, delete it.
import { getItem, updateStatus, deleteItem } from "./api.js";
import { detailContent, loadingState, escapeHtml } from "./components.js";
import { openEditForm, setOnEdited } from "./form.js";

const detailDialog = document.getElementById("detail-dialog");
const detailBody = document.getElementById("detail-body");
const detailActions = document.getElementById("detail-actions");
const detailError = document.getElementById("detail-error");

const confirmDialog = document.getElementById("confirm-dialog");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmOk = document.getElementById("confirm-ok");

// Same table as the backend (BE/utils/validators.js). The backend still enforces it.
const TRANSITIONS = {
  Lost: { Lost: ["Found", "Returned"], Found: ["Returned"], Returned: [] },
  Found: { Found: ["Returned"], Returned: [] },
};
const ACTION_LABELS = {
  Lost: { Found: "Mark as found", Returned: "Mark as returned" },
  Found: { Returned: "Mark as returned" },
};

let currentItem = null;
let onChange = () => {};

// main.js decides what to refresh after a change
export function setOnChange(callback) {
  onChange = callback;
}

// ---------- Confirm dialog (returns a Promise<boolean>) ----------

function confirmAction({ title, message, confirmText, danger = false }) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmOk.textContent = confirmText;
  confirmOk.className = `btn ${danger ? "btn--danger" : "btn--primary"}`;
  confirmDialog.returnValue = ""; // Esc leaves the old value, so reset it first
  confirmDialog.showModal();
  return new Promise((resolve) => {
    confirmDialog.addEventListener(
      "close",
      () => resolve(confirmDialog.returnValue === "confirm"),
      { once: true }
    );
  });
}

// ---------- Rendering ----------

function actionsHtml(item) {
  const next = TRANSITIONS[item.type][item.status] || [];
  const statusButtons = next
    .map((status) => {
      const style = status === "Returned" ? "btn--primary" : "btn--success";
      return `<button type="button" class="btn ${style}" data-detail-action="status" data-status="${escapeHtml(status)}">${escapeHtml(ACTION_LABELS[item.type][status])}</button>`;
    })
    .join("");

  const hint = next.length
    ? `<p class="help detail__hint"><strong>Found</strong> = someone has the item. <strong>Returned</strong> = the owner has it back (this cannot be undone).</p>`
    : "";

  return `
    ${hint}
    <div class="detail__buttons">
      ${statusButtons}
      <button type="button" class="btn btn--secondary" data-detail-action="edit">Edit</button>
      <button type="button" class="btn btn--danger" data-detail-action="delete">Delete</button>
    </div>`;
}

function render(item) {
  currentItem = item;
  detailBody.innerHTML = detailContent(item);
  detailActions.innerHTML = actionsHtml(item);
  detailError.textContent = "";
}

function setBusy(isBusy) {
  detailActions.querySelectorAll("button").forEach((button) => (button.disabled = isBusy));
}

// ---------- Open ----------

// Show an item we already have (e.g. after editing)
export function showDetails(item) {
  render(item);
  if (!detailDialog.open) detailDialog.showModal();
}

// Open by id: fetch the latest data from the backend first
export async function openDetails(id) {
  currentItem = null;
  detailBody.innerHTML = loadingState("Loading details...");
  detailActions.innerHTML = "";
  detailError.textContent = "";
  detailDialog.showModal();
  try {
    render(await getItem(id));
  } catch (error) {
    detailBody.innerHTML = "";
    detailError.textContent = error.message;
  }
}

// ---------- Actions ----------

async function changeStatus(status) {
  if (status === "Returned") {
    const ok = await confirmAction({
      title: "Mark as returned?",
      message: "This means the owner has the item back. The report will be closed and the status cannot be changed again.",
      confirmText: "Yes, mark as returned",
    });
    if (!ok) return;
  }
  setBusy(true);
  detailError.textContent = "";
  try {
    const updated = await updateStatus(currentItem.id, status);
    render(updated);
    onChange(`"${updated.name}" is now ${updated.status.toLowerCase()}.`);
  } catch (error) {
    detailError.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

async function removeItem() {
  const ok = await confirmAction({
    title: "Delete this report?",
    message: `"${currentItem.name}" and its photo will be permanently deleted. This cannot be undone.`,
    confirmText: "Delete",
    danger: true,
  });
  if (!ok) return;
  setBusy(true);
  try {
    await deleteItem(currentItem.id);
    detailDialog.close();
    onChange("The report was deleted.");
  } catch (error) {
    detailError.textContent = error.message;
    setBusy(false);
  }
}

detailDialog.addEventListener("click", (event) => {
  if (event.target === detailDialog) {
    detailDialog.close(); // click on the dark backdrop
    return;
  }
  const button = event.target.closest("[data-detail-action]");
  if (!button || !currentItem) return;

  const action = button.dataset.detailAction;
  if (action === "status") changeStatus(button.dataset.status);
  if (action === "delete") removeItem();
  if (action === "edit") {
    detailDialog.close();
    openEditForm(currentItem);
  }
});

document.getElementById("detail-close").addEventListener("click", () => detailDialog.close());

// After a successful edit, refresh the page lists and show the updated details again
setOnEdited((updated) => {
  onChange("Changes saved.");
  showDetails(updated);
});