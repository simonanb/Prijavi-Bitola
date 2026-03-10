const { Database } = require('node-sqlite3-wasm');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category    TEXT    NOT NULL,
    description TEXT,
    lat         REAL    NOT NULL,
    lng         REAL    NOT NULL,
    photo       TEXT,
    status      TEXT    NOT NULL DEFAULT 'submitted',
    upvotes     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;
