import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, logAudit } from '../middleware/auth.js';

const router = express.Router();

// Require both authentication and Admin clearance
router.use(authenticateToken);

// Publicly readable within system (staff need to view active racks and apps for intake)
router.get('/racks/active', async (req, res) => {
  try {
    const racks = await db.all(`
      SELECT 
        r.id, 
        r.rack_code, 
        r.zone, 
        r.capacity,
        COUNT(p.id) as current_count
      FROM racks r
      LEFT JOIN parcels p ON r.rack_code = p.rack_no AND p.status = 'Pending'
      WHERE r.is_active = 1
      GROUP BY r.id
      ORDER BY r.rack_code ASC
    `);
    res.json(racks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve active racks.' });
  }
});

router.get('/apps/active', async (req, res) => {
  try {
    const apps = await db.all('SELECT * FROM delivery_apps WHERE is_active = 1 ORDER BY name ASC');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve active delivery apps.' });
  }
});

// Admin-only management endpoints below
router.use(requireAdmin);

// 1. Rack Management
router.get('/racks', async (req, res) => {
  try {
    const racks = await db.all(`
      SELECT 
        r.*, 
        COUNT(p.id) as current_count
      FROM racks r
      LEFT JOIN parcels p ON r.rack_code = p.rack_no AND p.status = 'Pending'
      GROUP BY r.id
      ORDER BY r.rack_code ASC
    `);
    res.json(racks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch racks.' });
  }
});

router.post('/racks', async (req, res) => {
  const { rack_code, zone, capacity } = req.body;
  if (!rack_code || !zone) {
    return res.status(400).json({ error: 'Rack code and zone location are required.' });
  }

  try {
    const existing = await db.get('SELECT id FROM racks WHERE rack_code = ?', [rack_code.trim().toUpperCase()]);
    if (existing) {
      return res.status(400).json({ error: 'A rack with this code already exists.' });
    }

    const result = await db.run(
      'INSERT INTO racks (rack_code, zone, capacity, is_active) VALUES (?, ?, ?, 1)',
      [rack_code.trim().toUpperCase(), zone.trim(), parseInt(capacity) || 20]
    );

    await logAudit(
      req.user.id,
      req.user.username,
      'RACK_CREATE',
      `Created storage rack ${rack_code.trim().toUpperCase()} in ${zone.trim()}`
    );

    res.status(201).json({ message: 'Rack successfully provisioned.', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create new rack.' });
  }
});

router.put('/racks/:id/toggle', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const rack = await db.get('SELECT * FROM racks WHERE id = ?', [id]);
    if (!rack) return res.status(404).json({ error: 'Rack not found.' });

    const newStatus = rack.is_active === 1 ? 0 : 1;
    await db.run('UPDATE racks SET is_active = ? WHERE id = ?', [newStatus, id]);

    await logAudit(
      req.user.id,
      req.user.username,
      'RACK_STATUS_CHANGE',
      `Changed rack ${rack.rack_code} status to ${newStatus === 1 ? 'ACTIVE' : 'INACTIVE'}`
    );

    res.json({ message: `Rack ${rack.rack_code} is now ${newStatus === 1 ? 'active' : 'inactive'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rack status.' });
  }
});

// 2. Staff Management
router.get('/staff', async (req, res) => {
  try {
    const staffList = await db.all(`
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.badge_id, 
        u.role, 
        u.is_active, 
        u.created_at,
        (SELECT COUNT(*) FROM parcels WHERE received_by = u.username) as intakes_count,
        (SELECT COUNT(*) FROM parcels WHERE delivered_by = u.username) as deliveries_count
      FROM users u
      ORDER BY u.role ASC, u.full_name ASC
    `);
    res.json(staffList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff directory.' });
  }
});

router.post('/staff', async (req, res) => {
  const { username, password, full_name, badge_id, role } = req.body;
  if (!username || !password || !full_name || !badge_id) {
    return res.status(400).json({ error: 'Username, password, full name, and badge ID are required.' });
  }

  try {
    const existing = await db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [username.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'A staff member with this username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.run(
      'INSERT INTO users (username, password_hash, full_name, badge_id, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [username.trim().toLowerCase(), passwordHash, full_name.trim(), badge_id.trim().toUpperCase(), role === 'admin' ? 'admin' : 'staff']
    );

    await logAudit(
      req.user.id,
      req.user.username,
      'STAFF_REGISTER',
      `Registered new ${role} user: ${username.trim()} (Badge: ${badge_id})`
    );

    res.status(201).json({ message: 'Staff member registered successfully.', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

router.put('/staff/:id/toggle', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) return res.status(404).json({ error: 'Staff account not found.' });

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own active session account.' });
    }

    const newStatus = targetUser.is_active === 1 ? 0 : 1;
    await db.run('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    await logAudit(
      req.user.id,
      req.user.username,
      'STAFF_STATUS_CHANGE',
      `Account ${targetUser.username} set to ${newStatus === 1 ? 'ACTIVE' : 'DEACTIVATED'}`
    );

    res.json({ message: `User account is now ${newStatus === 1 ? 'active' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle account status.' });
  }
});

// 3. E-commerce App Management
router.get('/apps', async (req, res) => {
  try {
    const apps = await db.all('SELECT * FROM delivery_apps ORDER BY name ASC');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery apps.' });
  }
});

router.post('/apps', async (req, res) => {
  const { name, color_code } = req.body;
  if (!name) return res.status(400).json({ error: 'App carrier name is required.' });

  try {
    const existing = await db.get('SELECT id FROM delivery_apps WHERE name = ? COLLATE NOCASE', [name.trim()]);
    if (existing) return res.status(400).json({ error: 'This delivery app already exists.' });

    const result = await db.run(
      'INSERT INTO delivery_apps (name, color_code, is_active) VALUES (?, ?, 1)',
      [name.trim(), color_code || '#00f0ff']
    );

    await logAudit(
      req.user.id,
      req.user.username,
      'APP_REGISTER',
      `Added courier app partner: ${name.trim()}`
    );

    res.status(201).json({ message: 'App added successfully.', id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register delivery partner.' });
  }
});

// 4. Audit Activity Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit log records.' });
  }
});

export default router;
