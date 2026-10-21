// Quick test for the model. Uses a separate test database,
// so your real data in data/lostbu.db is never touched.
// Run from the BE folder:  npm run test:model

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const testDb = path.join(__dirname, "..", "data", "test.db");
fs.mkdirSync(path.dirname(testDb), { recursive: true });
fs.rmSync(testDb, { force: true }); // start fresh every run
process.env.DB_PATH = testDb; // must be set BEFORE requiring the model

const model = require("../models/itemModel");

function check(label, fn) {
  fn();
  console.log(`PASS  ${label}`);
}

check("seed data inserted (8 items)", () => {
  assert.equal(model.findAll().length, 8);
});

check("running seed again does not create duplicates", () => {
  assert.equal(model.seedIfEmpty(), false);
  assert.equal(model.findAll().length, 8);
});

check("countByStatus returns Lost 2, Found 4, Returned 2", () => {
  assert.deepEqual(model.countByStatus(), { Lost: 2, Found: 4, Returned: 2 });
});

check("search 'wallet' finds 1 item", () => {
  assert.equal(model.findAll({ search: "wallet" }).length, 1);
});

check("category 'Electronics' finds 2 items", () => {
  assert.equal(model.findAll({ category: "Electronics" }).length, 2);
});

check("type 'Lost' finds 4 items, status 'Found' finds 4 items", () => {
  assert.equal(model.findAll({ type: "Lost" }).length, 4);
  assert.equal(model.findAll({ status: "Found" }).length, 4);
});

check("filters work together (earbuds + Electronics + Lost = 1)", () => {
  const result = model.findAll({ search: "earbuds", category: "Electronics", status: "Lost" });
  assert.equal(result.length, 1);
});

check("filters with no match return an empty array", () => {
  assert.deepEqual(model.findAll({ search: "zzzz-no-match" }), []);
});

check("sort newest/oldest are opposite", () => {
  const newest = model.findAll({ sort: "newest" });
  const oldest = model.findAll({ sort: "oldest" });
  assert.equal(newest[0].name, "Casio scientific calculator");
  assert.equal(oldest[0].name, "Student ID Card (Engineering)");
});

let createdId;
check("create adds an item with status = type", () => {
  const item = model.create({
    type: "Lost", name: "Test umbrella", category: "Other",
    description: "Black umbrella with a wooden handle.",
    location: "Bus stop", eventDate: "2026-10-20", contact: "LINE: test",
  });
  createdId = item.id;
  assert.equal(item.status, "Lost");
  assert.equal(item.imageUrl, null);
  assert.equal(model.findAll().length, 9);
});

check("findById returns the item, or null when missing", () => {
  assert.equal(model.findById(createdId).name, "Test umbrella");
  assert.equal(model.findById(9999), null);
});

check("update changes the status and keeps type", () => {
  const item = model.update(createdId, { status: "Found" });
  assert.equal(item.status, "Found");
  assert.equal(item.type, "Lost");
});

check("update on a missing id returns null", () => {
  assert.equal(model.update(9999, { status: "Found" }), null);
});

check("remove deletes the item, and false when missing", () => {
  assert.equal(model.remove(createdId), true);
  assert.equal(model.remove(createdId), false);
  assert.equal(model.findAll().length, 8);
});

console.log("\nAll model tests passed.");