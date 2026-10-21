// A small custom error that carries an HTTP status code and field errors.
class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Handles URLs that do not exist (runs after all routes)
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Handles every error passed to next(error). Must have 4 parameters.
function errorHandler(error, req, res, next) {
  // Malformed JSON body sent by the client
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body is not valid JSON" });
  }

  if (error instanceof AppError) {
    const body = { success: false, message: error.message };
    if (error.errors) body.errors = error.errors;
    return res.status(error.statusCode).json(body);
  }

  // Unknown error: log the details for us, but do not leak them to the client
  console.error(error);
  res.status(500).json({ success: false, message: "Internal server error" });
}

module.exports = { AppError, notFoundHandler, errorHandler };