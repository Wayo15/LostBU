// Load variables from .env into process.env (must run first)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const itemsRouter = require("./routes/items");
const { UPLOAD_DIR } = require("./utils/uploads");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Serve uploaded images at /uploads/<file name>
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    index: false, // no directory listing
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LostBU API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/items", itemsRouter);

// These two must be LAST: unknown URLs first, then error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});