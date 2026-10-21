// Model layer: the ONLY file that talks to the database.
// It does not validate input or apply business rules (services/validators do that).

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { seedItems } = require("./seedData");

// 1. Open (or create) the database file
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "..", "data", "lostbu.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

// 2. Create the table if it does not exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL CHECK (type IN ('Lost', 'Found')),
    status      TEXT NOT NULL CHECK (status IN ('Lost', 'Found', 'Returned')),
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    location    TEXT NOT NULL,
    eventDate   TEXT NOT NULL,
    contact     TEXT NOT NULL,
    imageUrl    TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  )
`);

// Rows from SQLite have no normal prototype, so copy them into plain objects.
function toItem(row) {
  return row ? { ...row } : null;
}

// ---------- READ ----------

// filters: { search, category, type, status, sort }
function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    // Escape % and _ so users can search for those characters literally
    const escaped = String(filters.search).trim().replace(/[\\%_]/g, "\\$&");
    conditions.push("(name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    params.push(`%${escaped}%`, `%${escaped}%`);
  }
  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }
  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  // Never put user input directly into ORDER BY; only choose from a fixed list.
  const order =
    filters.sort === "oldest"
      ? "ORDER BY createdAt ASC, id ASC"
      : "ORDER BY createdAt DESC, id DESC";

  const rows = db.prepare(`SELECT * FROM items ${where} ${order}`).all(...params);
  return rows.map(toItem);
}

function findById(id) {
  return toItem(db.prepare("SELECT * FROM items WHERE id = ?").get(id));
}

// Returns { Lost: n, Found: n, Returned: n } for the dashboard cards
function countByStatus() {
  const counts = { Lost: 0, Found: 0, Returned: 0 };
  const rows = db.prepare("SELECT status, COUNT(*) AS total FROM items GROUP BY status").all();
  for (const row of rows) {
    counts[row.status] = row.total;
  }
  return counts;
}

// ---------- CREATE ----------

function create(data) {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO items
        (type, status, name, category, description, location, eventDate, contact, imageUrl, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.type,
      data.status ?? data.type, // a new report starts with status = type
      data.name,
      data.category,
      data.description,
      data.location,
      data.eventDate,
      data.contact,
      data.imageUrl ?? null,
      data.createdAt ?? now,
      data.updatedAt ?? now
    );
  return findById(Number(result.lastInsertRowid));
}

// ---------- UPDATE ----------

// Only these fields can be changed. "type", "id" and "createdAt" are never updated.
const UPDATABLE_FIELDS = [
  "status", "name", "category", "description",
  "location", "eventDate", "contact", "imageUrl",
];

function update(id, data) {
  if (!findById(id)) return null;

  const fields = UPDATABLE_FIELDS.filter((field) => data[field] !== undefined);
  if (fields.length > 0) {
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => data[field]);
    db.prepare(`UPDATE items SET ${setClause}, updatedAt = ? WHERE id = ?`).run(
      ...values,
      new Date().toISOString(),
      id
    );
  }
  return findById(id);
}

// ---------- DELETE ----------

function remove(id) {
  const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);
  return result.changes > 0;
}

// ---------- SEED ----------

// Insert demo data only if the table is empty -> no duplicates on restart
function seedIfEmpty() {
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM items").get();
  if (total > 0) return false;
  for (const item of seedItems) {
    create(item);
  }
  return true;
}

seedIfEmpty();

module.exports = { findAll, findById, create, update, remove, countByStatus, seedIfEmpty };