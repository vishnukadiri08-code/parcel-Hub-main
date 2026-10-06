import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateToken, logAudit, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid security credentials.' });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'Account has been deactivated. Contact Administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid security credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(user.id, user.username, 'LOGIN', `User ${user.username} logged into Command Center`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        badgeId: user.badge_id,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal security authentication error.' });
  }
});

// Check Session / Current User
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      fullName: req.user.full_name,
      badgeId: req.user.badge_id,
      role: req.user.role
    }
  });
});

export default router;
