import express from 'express';
import { db } from '../db.js';
import { authenticateToken, logAudit } from '../middleware/auth.js';
import { syncParcelHistoryWorkbook } from '../historyWorkbook.js';

const router = express.Router();

// All parcel routes require authentication
router.use(authenticateToken);

async function syncHistoryWorkbookOrRespond(res, failureMessage) {
  try {
    await syncParcelHistoryWorkbook();
    return true;
  } catch (error) {
    console.error('Failed to synchronize parcel history workbook:', error);
    res.status(503).json({ error: failureMessage });
    return false;
  }
}

// 1. Dashboard Statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const pendingRow = await db.get(
      "SELECT COUNT(*) as count FROM parcels WHERE status = 'Pending'"
    );
    const todayArrivalsRow = await db.get(
      "SELECT COUNT(*) as count FROM parcels WHERE date(received_at) = date('now', 'localtime')"
    );
    const todayDeliveriesRow = await db.get(
      "SELECT COUNT(*) as count FROM parcels WHERE status = 'Delivered' AND date(delivered_at) = date('now', 'localtime')"
    );
    const overdueRow = await db.get(
      "SELECT COUNT(*) as count FROM parcels WHERE status = 'Pending' AND (julianday('now') - julianday(received_at)) >= 7"
    );

    // Rack occupancy stats
    const racks = await db.all(`
      SELECT 
        r.rack_code, 
        r.zone, 
        r.capacity, 
        COUNT(p.id) as current_parcels
      FROM racks r
      LEFT JOIN parcels p ON r.rack_code = p.rack_no AND p.status = 'Pending'
      WHERE r.is_active = 1
      GROUP BY r.id
      ORDER BY r.rack_code ASC
    `);

    // Recent activity stream
    const recentActivity = await db.all(`
      SELECT id, username, action, details, timestamp 
      FROM audit_logs 
      ORDER BY id DESC 
      LIMIT 8
    `);

    res.json({
      pendingCount: pendingRow ? pendingRow.count : 0,
      todayArrivals: todayArrivalsRow ? todayArrivalsRow.count : 0,
      todayDeliveries: todayDeliveriesRow ? todayDeliveriesRow.count : 0,
      overdueCount: overdueRow ? overdueRow.count : 0,
      rackOccupancy: racks,
      recentActivity
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to retrieve command center statistics.' });
  }
});

// Comprehensive Reports Analytics
router.get('/reports-stats', async (req, res) => {
  try {
    // 1. Distribution by Carrier App
    const carrierStats = await db.all(`
      SELECT 
        app_name, 
        COUNT(*) as total_received,
        SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as total_delivered,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as total_pending
      FROM parcels
      GROUP BY app_name
      ORDER BY total_received DESC
    `);

    // 2. Turnover Metrics
    const turnaround = await db.get(`
      SELECT 
        AVG(julianday(delivered_at) - julianday(received_at)) as avg_days_to_deliver,
        COUNT(*) as total_completed
      FROM parcels
      WHERE status = 'Delivered' AND delivered_at IS NOT NULL
    `);

    // 3. Daily intake over the past 7 days
    const dailyIntake = await db.all(`
      SELECT 
        date(received_at) as intake_date, 
        COUNT(*) as intake_count
      FROM parcels
      WHERE date(received_at) >= date('now', '-7 days')
      GROUP BY date(received_at)
      ORDER BY intake_date ASC
    `);

    // 4. Overdue list
    const overdueList = await db.all(`
      SELECT id, person_name, phone, app_name, rack_no, received_at, tracking_id,
             CAST((julianday('now') - julianday(received_at)) AS INTEGER) as days_waiting
      FROM parcels
      WHERE status = 'Pending' AND (julianday('now') - julianday(received_at)) >= 7
      ORDER BY days_waiting DESC
    `);

    res.json({
      carrierStats,
      avgTurnaroundDays: turnaround && turnaround.avg_days_to_deliver ? parseFloat(turnaround.avg_days_to_deliver).toFixed(1) : '1.2',
      totalDeliveredLifetime: turnaround ? turnaround.total_completed : 0,
      dailyIntake,
      overdueList
    });
  } catch (err) {
    console.error('Error calculating reports stats:', err);
    res.status(500).json({ error: 'Failed to generate security analytics report.' });
  }
});

// 2. Pending Parcels List with calculated days waiting
router.get('/pending', async (req, res) => {
  const { search, rack, app, overdueOnly } = req.query;

  try {
    let query = `
      SELECT 
        id, 
        person_name, 
        phone, 
        app_name, 
        tracking_id, 
        rack_no, 
        received_at, 
        received_by, 
        status,
        CAST((julianday('now') - julianday(received_at)) AS INTEGER) as days_waiting,
        CASE WHEN (julianday('now') - julianday(received_at)) >= 7 THEN 1 ELSE 0 END as is_overdue
      FROM parcels 
      WHERE status = 'Pending'
    `;
    const params = [];

    if (rack && rack !== 'ALL') {
      query += ` AND rack_no = ?`;
      params.push(rack);
    }

    if (app && app !== 'ALL') {
      query += ` AND app_name = ?`;
      params.push(app);
    }

    if (overdueOnly === 'true' || overdueOnly === '1') {
      query += ` AND (julianday('now') - julianday(received_at)) >= 7`;
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (
        person_name LIKE ? OR 
        phone LIKE ? OR 
        app_name LIKE ? OR 
        rack_no LIKE ? OR 
        tracking_id LIKE ?
      )`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY received_at ASC`;

    const parcels = await db.all(query, params);
    res.json(parcels);
  } catch (err) {
    console.error('Error fetching pending parcels:', err);
    res.status(500).json({ error: 'Failed to fetch pending parcel registry.' });
  }
});

// 3. Parcel History (all received parcels, including pending and delivered)
router.get('/history', async (req, res) => {
  const { search, startDate, endDate, rack, app, staff } = req.query;

  try {
    let query = `
      SELECT 
        id, 
        person_name, 
        phone, 
        app_name, 
        tracking_id, 
        rack_no, 
        received_at, 
        received_by, 
        status,
        delivered_at,
        delivered_by,
        recipient_note
      FROM parcels 
      WHERE 1 = 1
    `;
    const params = [];

    if (rack && rack !== 'ALL') {
      query += ` AND rack_no = ?`;
      params.push(rack);
    }

    if (app && app !== 'ALL') {
      query += ` AND app_name = ?`;
      params.push(app);
    }

    if (staff && staff !== 'ALL') {
      query += ` AND (delivered_by = ? OR received_by = ?)`;
      params.push(staff, staff);
    }

    if (startDate) {
      query += ` AND date(received_at) >= date(?)`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date(received_at) <= date(?)`;
      params.push(endDate);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (
        person_name LIKE ? OR 
        phone LIKE ? OR 
        app_name LIKE ? OR 
        rack_no LIKE ? OR 
        tracking_id LIKE ? OR
        delivered_by LIKE ? OR
        received_by LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term);
    }

    query += ` ORDER BY received_at DESC, id DESC`;

    const parcels = await db.all(query, params);
    res.json(parcels);
  } catch (err) {
    console.error('Error fetching parcel history:', err);
    res.status(500).json({ error: 'Failed to retrieve parcel history.' });
  }
});

router.delete('/history/:id', async (req, res) => {
  const parcelId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(parcelId) || parcelId < 1) {
    return res.status(400).json({ error: 'A valid parcel ID is required.' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: 'You are not authorized to delete parcel history.' });
  }

  try {
    const parcel = await db.get(
      'SELECT id, person_name, status FROM parcels WHERE id = ?',
      [parcelId]
    );
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel history record not found.' });
    }

    if (req.user.role === 'staff' && parcel.status !== 'Delivered') {
      return res.status(403).json({ error: 'Security staff can delete delivered history only.' });
    }

    const result = await db.run('DELETE FROM parcels WHERE id = ?', [parcelId]);
    if (result.changes !== 1) {
      return res.status(409).json({ error: 'Parcel history record was not deleted.' });
    }

    await logAudit(
      req.user.id,
      req.user.username,
      'PARCEL_HISTORY_DELETE',
      `Permanently deleted parcel CPH-${String(parcel.id).padStart(5, '0')} (${parcel.status}) for ${parcel.person_name}`
    );

    if (!await syncHistoryWorkbookOrRespond(
      res,
      'The parcel was deleted, but the Excel history workbook could not be updated. Do not repeat the deletion; contact an administrator.'
    )) return;

    res.json({ message: 'Parcel history record permanently deleted.' });
  } catch (err) {
    console.error('Error deleting parcel history record:', err);
    res.status(500).json({ error: 'Failed to delete parcel history record.' });
  }
});

// 4. Duplicate Tracking ID Check
router.get('/check-tracking/:trackingId', async (req, res) => {
  const trackingId = req.params.trackingId.trim();
  if (!trackingId) {
    return res.json({ exists: false });
  }

  try {
    const existing = await db.get(
      "SELECT id, person_name, phone, app_name, rack_no, received_at FROM parcels WHERE tracking_id = ? AND status = 'Pending' COLLATE NOCASE",
      [trackingId]
    );

    if (existing) {
      return res.json({ exists: true, parcel: existing });
    }
    return res.json({ exists: false });
  } catch (err) {
    console.error('Error checking duplicate tracking ID:', err);
    res.status(500).json({ error: 'Failed to verify tracking number.' });
  }
});

// 5. Add New Parcel (Intake)
router.post('/', async (req, res) => {
  const { person_name, phone, app_name, tracking_id, rack_no } = req.body;

  if (!person_name || !phone || !app_name || !rack_no) {
    return res.status(400).json({ error: 'Student/Faculty name, phone number, carrier app, and rack number are required.' });
  }

  // Clean and validate 10-digit phone number
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  const cleanTracking = tracking_id ? tracking_id.trim() : null;

  try {
    // Current local ISO timestamp
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = await db.run(
      `INSERT INTO parcels (
        person_name, phone, app_name, tracking_id, rack_no, received_at, received_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        person_name.trim(),
        cleanPhone,
        app_name.trim(),
        cleanTracking,
        rack_no.trim(),
        now,
        req.user.username
      ]
    );

    const newParcel = await db.get('SELECT * FROM parcels WHERE id = ?', [result.lastID]);

    await logAudit(
      req.user.id,
      req.user.username,
      'PARCEL_INTAKE',
      `Intake parcel #${newParcel.id} for ${newParcel.person_name} (${newParcel.app_name}) -> Rack: ${newParcel.rack_no}`
    );

    if (!await syncHistoryWorkbookOrRespond(
      res,
      'The parcel was saved, but the Excel history workbook could not be updated. Do not submit it again; contact an administrator.'
    )) return;

    res.status(201).json({
      message: 'Parcel securely logged and assigned to rack.',
      parcel: newParcel
    });
  } catch (err) {
    console.error('Error registering parcel intake:', err);
    res.status(500).json({ error: 'Failed to save parcel into security database.' });
  }
});

// 6. Mark As Delivered (Handover)
router.put('/:id/deliver', async (req, res) => {
  const parcelId = parseInt(req.params.id, 10);
  const { recipient_note } = req.body;

  if (isNaN(parcelId)) {
    return res.status(400).json({ error: 'Invalid parcel ID.' });
  }

  try {
    const existing = await db.get('SELECT * FROM parcels WHERE id = ?', [parcelId]);
    if (!existing) {
      return res.status(404).json({ error: 'Parcel not found in command registry.' });
    }

    if (existing.status === 'Delivered') {
      return res.status(400).json({
        error: `Parcel #${parcelId} was already handed over and delivered by ${existing.delivered_by} on ${existing.delivered_at}.`
      });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(
      `UPDATE parcels 
       SET status = 'Delivered', 
           delivered_at = ?, 
           delivered_by = ?, 
           recipient_note = ?
       WHERE id = ?`,
      [now, req.user.username, recipient_note ? recipient_note.trim() : null, parcelId]
    );

    const updated = await db.get('SELECT * FROM parcels WHERE id = ?', [parcelId]);

    await logAudit(
      req.user.id,
      req.user.username,
      'PARCEL_DELIVERED',
      `Handed over parcel #${parcelId} to ${updated.person_name} (Phone: ${updated.phone}) by ${req.user.username}`
    );

    if (!await syncHistoryWorkbookOrRespond(
      res,
      'The delivery was recorded, but the Excel history workbook could not be updated. Do not repeat the handover; contact an administrator.'
    )) return;

    res.json({
      message: 'Parcel status updated to Delivered and history workbook synchronized.',
      parcel: updated
    });
  } catch (err) {
    console.error('Error updating parcel to delivered:', err);
    res.status(500).json({ error: 'Failed to complete delivery handover in database.' });
  }
});

// 7. Get single parcel by ID
router.get('/:id', async (req, res) => {
  const parcelId = parseInt(req.params.id, 10);
  try {
    const parcel = await db.get(
      `SELECT *,
        CAST((julianday('now') - julianday(received_at)) AS INTEGER) as days_waiting
       FROM parcels WHERE id = ?`,
      [parcelId]
    );
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel record not found.' });
    }
    res.json(parcel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch parcel record.' });
  }
});

export default router;
