// Database setup. better-sqlite3 is a beginner-friendly SQLite library:
// it is synchronous, so you can write `db.prepare(...).all()` without
// callbacks or async/await.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Open (or create) the SQLite database and make sure the `tasks` table
 * exists. Exported as a function so tests can create isolated databases.
 *
 * @param {string} dbPath - File path, or ":memory:" for a throwaway DB.
 */
export function createDb(dbPath) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      description   TEXT    NOT NULL DEFAULT '',
      completed     INTEGER NOT NULL DEFAULT 0, -- SQLite has no boolean; 0 = false, 1 = true
      scheduledDate TEXT    DEFAULT NULL,       -- ISO string or date string (e.g. "2026-10-20")
      createdAt     TEXT    NOT NULL            -- ISO 8601 string, e.g. "2026-10-12T08:30:00.000Z"
    )
  `);

  // Ensure scheduledDate exists even on pre-existing databases
  const columns = db.prepare("PRAGMA table_info(tasks)").all();
  const hasScheduledDate = columns.some((col) => col.name === "scheduledDate");
  if (!hasScheduledDate) {
    db.exec("ALTER TABLE tasks ADD COLUMN scheduledDate TEXT DEFAULT NULL");
  }

  return db;
}

/** Convert a raw database row into the JSON shape the API returns. */
export function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    scheduledDate: row.scheduledDate || null,
    createdAt: row.createdAt,
  };
}
