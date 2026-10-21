// Report form (modal): open/close, validation, image preview and submit.
import { createItem } from "./api.js";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const dialog = document.getElementById("report-dialog");
const form = document.getElementById("report-form");
const titleEl = document.getElementById("report-title");
const typeInput = document.getElementById("report-type");
const locationLabel = document.getElementById("label-location");
const dateLabel = document.getElementById("label-date");
const descriptionHelp = document.getElementById("help-description");
const imageInput = document.getElementById("report-image");
const previewBox = document.getElementById("image-preview");
const formError = document.getElementById("form-error");
const submitButton = document.getElementById("report-submit");

const FIELDS = ["name", "category", "description", "location", "eventDate", "contact", "image"];

// Texts that change between "lost" and "found" reports
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
let onSuccess = () => {};

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
  if (previewUrl) URL.revokeObjectURL(previewUrl); // free the temporary URL
  previewUrl = null;
  previewBox.innerHTML = "";
  previewBox.hidden = true;
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
    imageInput.value = ""; // reject the file
    return;
  }
  if (file) {
    previewUrl = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = previewUrl;
    img.alt = "Preview of the selected image";
    previewBox.appendChild(img);
    previewBox.hidden = false;
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
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  errors.name = textError(String(data.get("name")), "Name", 2, 100);
  errors.category = data.get("category") ? "" : "Please choose a category";
  errors.description = textError(String(data.get("description")), "Description", 10, 1000);
  errors.location = textError(String(data.get("location")), "Location", 2, 150);
  errors.contact = textError(String(data.get("contact")), "Contact", 3, 200);

  const date = String(data.get("eventDate"));
  if (!date) errors.eventDate = "Date is required";
  else if (date > today) errors.eventDate = "Date cannot be in the future";

  errors.image = checkImage(imageInput.files[0]);

  FIELDS.forEach((field) => setFieldError(field, errors[field] || ""));
  const firstBad = FIELDS.find((field) => errors[field]);
  if (firstBad) form.elements[firstBad].focus();
  return !firstBad;
}

// ---------- Open / close ----------

export function openReportForm(type) {
  const copy = COPY[type];
  form.reset();
  clearErrors();
  clearPreview();
  typeInput.value = type;
  titleEl.textContent = copy.title;
  locationLabel.textContent = copy.location;
  dateLabel.textContent = copy.date;
  descriptionHelp.textContent = copy.description;
  submitButton.textContent = copy.submit;
  form.elements.eventDate.max = new Date().toLocaleDateString("en-CA");
  dialog.showModal();
}

function closeForm() {
  dialog.close();
}

dialog.addEventListener("close", clearPreview);

// Click on the dark backdrop closes the dialog
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeForm();
});
document.getElementById("report-cancel").addEventListener("click", closeForm);
document.getElementById("report-close").addEventListener("click", closeForm);

// ---------- Submit ----------

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  if (!validate()) return;

  const originalText = submitButton.textContent;
  submitButton.disabled = true; // prevents double submit
  submitButton.textContent = "Submitting...";

  try {
    const created = await createItem(new FormData(form));
    dialog.close();
    onSuccess(created);
  } catch (error) {
    // Show field errors returned by the backend next to their fields
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

// main.js registers what should happen after a successful submit
export function setOnSuccess(callback) {
  onSuccess = callback;
}