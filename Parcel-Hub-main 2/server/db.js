import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campus_hub.db');
const rawDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`[DB] Connected to SQLite database at ${dbPath}`);
  }
});

// Promisified DB helpers
export const db = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      rawDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      rawDb.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      badge_id TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      app_name TEXT NOT NULL,
      tracking_id TEXT,
      rack_no TEXT NOT NULL,
      received_at DATETIME NOT NULL,
      received_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      delivered_at DATETIME,
      delivered_by TEXT,
      recipient_note TEXT
    );

    CREATE TABLE IF NOT EXISTS racks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rack_code TEXT UNIQUE NOT NULL,
      zone TEXT NOT NULL,
      capacity INTEGER DEFAULT 25,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color_code TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
    CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_id);
    CREATE INDEX IF NOT EXISTS idx_parcels_phone ON parcels(phone);
    CREATE INDEX IF NOT EXISTS idx_parcels_rack ON parcels(rack_no);
    CREATE INDEX IF NOT EXISTS idx_parcels_received ON parcels(received_at);
  `);
  const retiredAccount = await db.run(
    'UPDATE users SET is_active = 0 WHERE username = ? COLLATE NOCASE AND is_active = 1',
    ['guard_priya']
  );
  if (retiredAccount.changes > 0) {
    console.log('[DB] Deactivated retired security account.');
  }
  console.log('[DB] Database tables initialized successfully.');
}
