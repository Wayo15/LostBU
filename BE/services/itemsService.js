// Business rules. Knows nothing about req/res; throws AppError when something is wrong.

const itemModel = require("../models/itemModel");
const { AppError } = require("../middleware/errorHandler");
const {
  TYPES, STATUSES, CATEGORIES, STATUS_TRANSITIONS,
  validateNewItem, validateItemUpdate,
} = require("../utils/validators");

// Trim text fields before saving
function cleanText(data) {
  const cleaned = { ...data };
  for (const field of ["name", "description", "location", "contact"]) {
    if (typeof cleaned[field] === "string") cleaned[field] = cleaned[field].trim();
  }
  return cleaned;
}

// Convert and check the :id from the URL
function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, "Item id must be a positive whole number");
  }
  return id;
}

function listItems(query) {
  const filters = {};
  const errors = {};

  if (query.search) filters.search = String(query.search);

  if (query.category) {
    if (CATEGORIES.includes(query.category)) filters.category = query.category;
    else errors.category = "Unknown category";
  }
  if (query.type) {
    if (TYPES.includes(query.type)) filters.type = query.type;
    else errors.type = "Type must be Lost or Found";
  }
  if (query.status) {
    if (STATUSES.includes(query.status)) filters.status = query.status;
    else errors.status = "Status must be Lost, Found or Returned";
  }
  if (query.sort) {
    if (["newest", "oldest"].includes(query.sort)) filters.sort = query.sort;
    else errors.sort = "Sort must be newest or oldest";
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(400, "Invalid query parameters", errors);
  }
  return itemModel.findAll(filters);
}

function getItem(rawId) {
  const item = itemModel.findById(parseId(rawId));
  if (!item) throw new AppError(404, "Item not found");
  return item;
}

function createItem(body) {
  const errors = validateNewItem(body);
  if (Object.keys(errors).length > 0) {
    throw new AppError(400, "Validation failed", errors);
  }
  const data = cleanText(body);
  // status is decided by the server, never trusted from the client
  return itemModel.create({
    type: data.type,
    status: data.type,
    name: data.name,
    category: data.category,
    description: data.description,
    location: data.location,
    eventDate: data.eventDate,
    contact: data.contact,
    imageUrl: data.imageUrl || null,
  });
}

function updateItem(rawId, body) {
  const id = parseId(rawId);
  const existing = itemModel.findById(id);
  if (!existing) throw new AppError(404, "Item not found");

  const errors = validateItemUpdate(body);
  if (Object.keys(errors).length > 0) {
    throw new AppError(400, "Validation failed", errors);
  }

  const data = cleanText(body);

  // Business rule: check the status transition
  if (data.status !== undefined && data.status !== existing.status) {
    const allowed = STATUS_TRANSITIONS[existing.type][existing.status];
    if (!allowed.includes(data.status)) {
      throw new AppError(400, `Cannot change status from ${existing.status} to ${data.status}`, {
        status: `A ${existing.type} item with status ${existing.status} can only change to: ${
          allowed.length ? allowed.join(", ") : "nothing (final status)"
        }`,
      });
    }
  }

  return itemModel.update(id, data);
}

function deleteItem(rawId) {
  const removed = itemModel.remove(parseId(rawId));
  if (!removed) throw new AppError(404, "Item not found");
}

function getStatusCounts() {
  return itemModel.countByStatus();
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, getStatusCounts };