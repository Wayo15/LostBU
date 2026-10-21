// Business rules. Knows nothing about req/res; throws AppError when something is wrong.

const itemModel = require("../models/itemModel");
const { AppError } = require("../middleware/errorHandler");
const {
  TYPES, STATUSES, CATEGORIES, STATUS_TRANSITIONS,
  validateNewItem, validateItemUpdate,
} = require("../utils/validators");
const { hasImageSignature, removeUploadedFile, removeStoredImage } = require("../utils/uploads");

const BAD_IMAGE_MESSAGE = "File is not a valid JPG, PNG or WebP image";

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

// "file" is the image saved by multer (or undefined when no image was sent).
// If anything fails, the saved file is deleted so no junk is left on disk.
function createItem(body, file) {
  try {
    const errors = validateNewItem(body);
    if (file && !hasImageSignature(file.path)) errors.image = BAD_IMAGE_MESSAGE;
    if (Object.keys(errors).length > 0) {
      throw new AppError(400, "Validation failed", errors);
    }

    const data = cleanText(body);
    // status is decided by the server; imageUrl comes only from an uploaded file,
    // never from text sent by the client.
    return itemModel.create({
      type: data.type,
      status: data.type,
      name: data.name,
      category: data.category,
      description: data.description,
      location: data.location,
      eventDate: data.eventDate,
      contact: data.contact,
      imageUrl: file ? `/uploads/${file.filename}` : null,
    });
  } catch (error) {
    removeUploadedFile(file);
    throw error;
  }
}

function updateItem(rawId, body, file) {
  try {
    const id = parseId(rawId);
    const existing = itemModel.findById(id);
    if (!existing) throw new AppError(404, "Item not found");

    const errors = validateItemUpdate(body);
    if (file && !hasImageSignature(file.path)) errors.image = BAD_IMAGE_MESSAGE;
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

    delete data.imageUrl; // clients cannot set an arbitrary image URL
    if (file) data.imageUrl = `/uploads/${file.filename}`;

    const updated = itemModel.update(id, data);
    if (file) removeStoredImage(existing.imageUrl); // old image is no longer needed
    return updated;
  } catch (error) {
    removeUploadedFile(file);
    throw error;
  }
}

function deleteItem(rawId) {
  const id = parseId(rawId);
  const item = itemModel.findById(id);
  if (!item) throw new AppError(404, "Item not found");
  itemModel.remove(id);
  removeStoredImage(item.imageUrl);
}

function getStatusCounts() {
  return itemModel.countByStatus();
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, getStatusCounts };