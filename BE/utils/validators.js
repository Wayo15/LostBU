// Pure validation helpers. They know nothing about HTTP or the database.

const TYPES = ["Lost", "Found"];
const STATUSES = ["Lost", "Found", "Returned"];
const CATEGORIES = [
  "ID Cards", "Wallets", "Keys", "Electronics",
  "Accessories", "Bottles", "Bags", "Other",
];

// Allowed status changes for each report type (see docs/API_CONTRACT.md)
const STATUS_TRANSITIONS = {
  Lost: { Lost: ["Found", "Returned"], Found: ["Returned"], Returned: [] },
  Found: { Found: ["Returned"], Returned: [] },
};

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects impossible dates such as 2026-02-31
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// Check one text field. Returns an error message or null.
function checkText(value, label, min, max) {
  if (typeof value !== "string" || value.trim() === "") return `${label} is required`;
  const length = value.trim().length;
  if (length < min) return `${label} must be at least ${min} characters`;
  if (length > max) return `${label} must be at most ${max} characters`;
  return null;
}

// Validate the body of POST /api/items. Returns an errors object ({} = valid).
function validateNewItem(body) {
  const errors = {};
  const data = body || {};

  if (!TYPES.includes(data.type)) errors.type = "Type must be Lost or Found";

  const nameError = checkText(data.name, "Name", 2, 100);
  if (nameError) errors.name = nameError;

  if (!CATEGORIES.includes(data.category)) {
    errors.category = `Category must be one of: ${CATEGORIES.join(", ")}`;
  }

  const descriptionError = checkText(data.description, "Description", 10, 1000);
  if (descriptionError) errors.description = descriptionError;

  const locationError = checkText(data.location, "Location", 2, 150);
  if (locationError) errors.location = locationError;

  const contactError = checkText(data.contact, "Contact", 3, 200);
  if (contactError) errors.contact = contactError;

  if (!isValidDate(data.eventDate)) {
    errors.eventDate = "Date must be a real date in YYYY-MM-DD format";
  } else if (data.eventDate > todayString()) {
    errors.eventDate = "Date cannot be in the future";
  }

  if (data.imageUrl != null && typeof data.imageUrl !== "string") {
    errors.imageUrl = "Image must be a string";
  }

  return errors;
}

// Validate the body of PUT /api/items/:id. Only fields that are sent are checked.
function validateItemUpdate(body) {
  const errors = {};
  const data = body || {};

  if (data.status !== undefined && !STATUSES.includes(data.status)) {
    errors.status = "Status must be Lost, Found or Returned";
  }
  if (data.name !== undefined) {
    const error = checkText(data.name, "Name", 2, 100);
    if (error) errors.name = error;
  }
  if (data.category !== undefined && !CATEGORIES.includes(data.category)) {
    errors.category = `Category must be one of: ${CATEGORIES.join(", ")}`;
  }
  if (data.description !== undefined) {
    const error = checkText(data.description, "Description", 10, 1000);
    if (error) errors.description = error;
  }
  if (data.location !== undefined) {
    const error = checkText(data.location, "Location", 2, 150);
    if (error) errors.location = error;
  }
  if (data.contact !== undefined) {
    const error = checkText(data.contact, "Contact", 3, 200);
    if (error) errors.contact = error;
  }
  if (data.eventDate !== undefined) {
    if (!isValidDate(data.eventDate)) {
      errors.eventDate = "Date must be a real date in YYYY-MM-DD format";
    } else if (data.eventDate > todayString()) {
      errors.eventDate = "Date cannot be in the future";
    }
  }
  if (data.imageUrl != null && typeof data.imageUrl !== "string") {
    errors.imageUrl = "Image must be a string";
  }

  return errors;
}

module.exports = {
  TYPES, STATUSES, CATEGORIES, STATUS_TRANSITIONS,
  validateNewItem, validateItemUpdate,
};