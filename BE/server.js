// Load variables from .env into process.env (must run first)
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: runs on every request before it reaches a route
app.use(cors({ origin: process.env.CORS_ORIGIN })); // allow the frontend to call us
app.use(express.json()); // read JSON bodies sent by the frontend

// Health-check: proves the server is alive
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LostBU API is running",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});