// Report form (modal): create a report or edit an existing one.
import { createItem, updateItem, imageSrc } from "./api.js";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_HELP = "JPG, PNG or WebP, up to 2 MB.";

const dialog = document.getElementById("report-dialog");
const form = document.getElementById("report-form");
const titleEl = document.getElementById("report-title");
const typeInput = document.getElementById("report-type");
const locationLabel = document.getElementById("label-location");
const dateLabel = document.getElementById("label-date");
const descriptionHelp = document.getElementById("help-description");
const imageHelp = document.getElementById("help-image");
const imageInput = document.getElementById("report-image");
const previewBox = document.getElementById("image-preview");
const formError = document.getElementById("form-error");
const submitButton = document.getElementById("report-submit");

const FIELDS = ["name", "category", "description", "location", "eventDate", "contact", "image"];
const EDITABLE_TEXT_FIELDS = ["name", "category", "description", "location", "eventDate", "contact"];

const COPY = {
  Lost: {
    title: "Report a lost item",
    location: "Last known location",
    date: "Date lost",
    description: "Describe the item (colour, brand, marks). Do not include ID numbers.",
    submit: "Submit lost report",
  },
  Found: {
    title: "Report a found item",
    location: "Where did you find it?",
    date: "Date found",
    description: "Describe the item in general terms. Keep one detail private so the real owner can prove it.",
    submit: "Submit found report",
  },
};

let previewUrl = null;
let editingId = null; // null = creating a new report
let onCreated = () => {};
let onEdited = () => {};

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

// ---------- Errors ----------

function setFieldError(field, message) {
  const errorEl = document.getElementById(`error-${field}`);
  const input = form.elements[field];
  errorEl.textContent = message || "";
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

function clearErrors() {
  FIELDS.forEach((field) => setFieldError(field, ""));
  formError.textContent = "";
}

// ---------- Image preview ----------

function clearPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  previewBox.innerHTML = "";
  previewBox.hidden = true;
}

function showPreview(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  previewBox.appendChild(img);
  previewBox.hidden = false;
}

function checkImage(file) {
  if (!file) return "";
  if (!IMAGE_TYPES.includes(file.type)) return "Image must be a JPG, PNG or WebP file";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 2 MB or smaller";
  return "";
}

imageInput.addEventListener("change", () => {
  clearPreview();
  const file = imageInput.files[0];
  const error = checkImage(file);
  setFieldError("image", error);
  if (error) {
    imageInput.value = "";
    return;
  }
  if (file) {
    previewUrl = URL.createObjectURL(file);
    showPreview(previewUrl, "Preview of the selected image");
  }
});

// ---------- Validation (same rules as the backend; the backend still decides) ----------

function textError(value, label, min, max) {
  const text = value.trim();
  if (!text) return `${label} is required`;
  if (text.length < min) return `${label} must be at least ${min} characters`;
  if (text.length > max) return `${label} must be at most ${max} characters`;
  return "";
}

function validate() {
  const data = new FormData(form);
  const errors = {};

  errors.name = textError(String(data.get("name")), "Name", 2, 100);
  errors.category = data.get("category") ? "" : "Please choose a category";
  errors.description = textError(String(data.get("description")), "Description", 10, 1000);
  errors.location = textError(String(data.get("location")), "Location", 2, 150);
  errors.contact = textError(String(data.get("contact")), "Contact", 3, 200);

  const date = String(data.get("eventDate"));
  if (!date) errors.eventDate = "Date is required";
  else if (date > today()) errors.eventDate = "Date cannot be in the future";

  errors.image = checkImage(imageInput.files[0]);

  FIELDS.forEach((field) => setFieldError(field, errors[field] || ""));
  const firstBad = FIELDS.find((field) => errors[field]);
  if (firstBad) form.elements[firstBad].focus();
  return !firstBad;
}

// ---------- Open / close ----------

// Reset the form and set the texts that depend on Lost/Found
function prepare(type) {
  const copy = COPY[type];
  form.reset();
  clearErrors();
  clearPreview();
  typeInput.value = type;
  locationLabel.textContent = copy.location;
  dateLabel.textContent = copy.date;
  descriptionHelp.textContent = copy.description;
  form.elements.eventDate.max = today();
  return copy;
}

export function openReportForm(type) {
  editingId = null;
  const copy = prepare(type);
  titleEl.textContent = copy.title;
  submitButton.textContent = copy.submit;
  imageHelp.textContent = IMAGE_HELP;
  dialog.showModal();
}

export function openEditForm(item) {
  editingId = item.id;
  prepare(item.type);
  titleEl.textContent = "Edit report";
  submitButton.textContent = "Save changes";
  imageHelp.textContent = `${IMAGE_HELP} Leave empty to keep the current photo.`;
  EDITABLE_TEXT_FIELDS.forEach((field) => {
    form.elements[field].value = item[field];
  });
  if (item.imageUrl) showPreview(imageSrc(item.imageUrl), "Current photo");
  dialog.showModal();
}

dialog.addEventListener("close", clearPreview);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close(); // click on the dark backdrop
});
document.getElementById("report-cancel").addEventListener("click", () => dialog.close());
document.getElementById("report-close").addEventListener("click", () => dialog.close());

// ---------- Submit ----------

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  if (!validate()) return;

  const wasEditing = editingId !== null;
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = wasEditing ? "Saving..." : "Submitting...";

  try {
    const formData = new FormData(form);
    const result = wasEditing ? await updateItem(editingId, formData) : await createItem(formData);
    dialog.close();
    (wasEditing ? onEdited : onCreated)(result);
  } catch (error) {
    const fieldErrors = error.fieldErrors || {};
    let shown = false;
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (FIELDS.includes(field)) {
        setFieldError(field, message);
        shown = true;
      }
    }
    formError.textContent = shown ? "Please fix the highlighted fields." : error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});

export function setOnSuccess(callback) {
  onCreated = callback;
}

export function setOnEdited(callback) {
  onEdited = callback;
}