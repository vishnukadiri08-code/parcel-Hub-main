import pg from 'pg';

const { Pool } = pg;

// Clean explicit connection to your Supabase instance using IPv4 mapping
const pool = new Pool({
  connectionString: "postgresql://postgres.nieemjmhanwlymnylcjy:7793989292kadiri@://supabase.com",
  ssl: { rejectUnauthorized: false }
});

// Promisified DB helpers matching old SQLite execution patterns
export const db = {
  get: async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows[0];
  },
  all: async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return res.rows || [];
  },
  run: async (sql, params = []) => {
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgSql, params);
    return { lastID: res.insertId || null, changes: res.rowCount };
  },
  exec: async (sql) => {
    return await pool.query(sql);
  }
};

export async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      badge_id TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id SERIAL PRIMARY KEY,
      person_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      app_name TEXT NOT NULL,
      tracking_id TEXT,
      rack_no TEXT NOT NULL,
      received_at TIMESTAMP NOT NULL,
      received_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      delivered_at TIMESTAMP,
      delivered_by TEXT,
      recipient_note TEXT
    );

    CREATE TABLE IF NOT EXISTS racks (
      id SERIAL PRIMARY KEY,
      rack_code TEXT UNIQUE NOT NULL,
      zone TEXT NOT NULL,
      capacity INTEGER DEFAULT 25,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_apps (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color_code TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
    CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_id);
    CREATE INDEX IF NOT EXISTS idx_parcels_phone ON parcels(phone);
    CREATE INDEX IF NOT EXISTS idx_parcels_rack ON parcels(rack_no);
    CREATE INDEX IF NOT EXISTS idx_parcels_received ON parcels(received_at);
  `);

  const retiredAccount = await db.run(
    'UPDATE users SET is_active = 0 WHERE LOWER(username) = LOWER(\$1) AND is_active = 1',
    ['guard_priya']
  );

  if (retiredAccount.changes > 0) {
    console.log('[DB] Deactivated retired security account.');
  }
  console.log('[DB] Supabase PostgreSQL tables initialized successfully.');
}
