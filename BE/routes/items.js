const express = require("express");
const controller = require("../controllers/itemsController");

const router = express.Router();

// IMPORTANT: "/stats" must come BEFORE "/:id",
// otherwise Express treats the word "stats" as an id.
router.get("/stats", controller.getStats);

router.get("/", controller.getItems);
router.get("/:id", controller.getItemById);
router.post("/", controller.createItem);
router.put("/:id", controller.updateItem);
router.delete("/:id", controller.deleteItem);

module.exports = router;