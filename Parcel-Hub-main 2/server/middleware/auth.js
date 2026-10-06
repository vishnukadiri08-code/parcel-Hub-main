import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'campus_parcel_hub_secure_tactical_key_2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, username, full_name, badge_id, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user || user.is_active !== 1) {
      return res.status(403).json({ error: 'User account is deactivated or no longer valid.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative clearance required for this operation.' });
  }
  next();
}

export async function logAudit(userId, username, action, details) {
  try {
    await db.run(
      'INSERT INTO audit_logs (user_id, username, action, details, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [userId || null, username || 'SYSTEM', action, details]
    );
  } catch (err) {
    console.error('[AUDIT_ERROR] Could not record audit log:', err.message);
  }
}
