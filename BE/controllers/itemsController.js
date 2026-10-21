// Controllers translate HTTP <-> service calls. No business rules here.
// Errors thrown by the service are passed to the error handler via next(error).

const itemsService = require("../services/itemsService");

function getItems(req, res, next) {
  try {
    const items = itemsService.listItems(req.query);
    res.json({ success: true, data: items, count: items.length });
  } catch (error) {
    next(error);
  }
}

function getItemById(req, res, next) {
  try {
    res.json({ success: true, data: itemsService.getItem(req.params.id) });
  } catch (error) {
    next(error);
  }
}

function createItem(req, res, next) {
  try {
    // req.file exists only when multer received an image
    const item = itemsService.createItem(req.body, req.file);
    res.status(201).json({ success: true, data: item, message: "Item reported successfully" });
  } catch (error) {
    next(error);
  }
}

function updateItem(req, res, next) {
  try {
    const item = itemsService.updateItem(req.params.id, req.body, req.file);
    res.json({ success: true, data: item, message: "Item updated successfully" });
  } catch (error) {
    next(error);
  }
}

function deleteItem(req, res, next) {
  try {
    itemsService.deleteItem(req.params.id);
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    next(error);
  }
}

function getStats(req, res, next) {
  try {
    res.json({ success: true, data: itemsService.getStatusCounts() });
  } catch (error) {
    next(error);
  }
}

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem, getStats };