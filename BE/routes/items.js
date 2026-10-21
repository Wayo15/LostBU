const express = require("express");
const controller = require("../controllers/itemsController");
const { uploadImage } = require("../utils/uploads");

const router = express.Router();

// IMPORTANT: "/stats" must come BEFORE "/:id",
// otherwise Express treats the word "stats" as an id.
router.get("/stats", controller.getStats);

router.get("/", controller.getItems);
router.get("/:id", controller.getItemById);

// uploadImage runs first: it reads multipart data (and skips plain JSON requests)
router.post("/", uploadImage, controller.createItem);
router.put("/:id", uploadImage, controller.updateItem);
router.delete("/:id", controller.deleteItem);

module.exports = router;