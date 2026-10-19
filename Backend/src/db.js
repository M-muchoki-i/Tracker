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
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      email        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      passwordHash TEXT    NOT NULL,
      salt         TEXT    NOT NULL,
      createdAt    TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      description   TEXT    NOT NULL DEFAULT '',
      completed     INTEGER NOT NULL DEFAULT 0, -- SQLite has no boolean; 0 = false, 1 = true
      scheduledDate TEXT    DEFAULT NULL,       -- ISO string or date string (e.g. "2026-10-20")
      userId        INTEGER DEFAULT NULL,       -- Optional foreign key referencing users(id)
      createdAt     TEXT    NOT NULL            -- ISO 8601 string, e.g. "2026-10-12T08:30:00.000Z"
    );
  `);

  // Auto-migration for existing tasks table columns
  const columns = db.prepare("PRAGMA table_info(tasks)").all();
  const hasScheduledDate = columns.some((col) => col.name === "scheduledDate");
  if (!hasScheduledDate) {
    db.exec("ALTER TABLE tasks ADD COLUMN scheduledDate TEXT DEFAULT NULL");
  }

  const hasUserId = columns.some((col) => col.name === "userId");
  if (!hasUserId) {
    db.exec("ALTER TABLE tasks ADD COLUMN userId INTEGER DEFAULT NULL");
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
    userId: row.userId || null,
    createdAt: row.createdAt,
  };
}

/** Convert a raw user database row into safe JSON (no hashes). */
export function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.createdAt,
  };
}
