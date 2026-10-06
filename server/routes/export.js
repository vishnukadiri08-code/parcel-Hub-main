import express from 'express';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, logAudit } from '../middleware/auth.js';
import { historyWorkbookPath } from '../historyWorkbook.js';

const router = express.Router();

router.use(authenticateToken);

// Download the last workbook synchronized from the live parcel records.
router.get('/history', async (req, res) => {
  try {
    const workbook = await fs.readFile(historyWorkbookPath);

    await logAudit(
      req.user.id,
      req.user.username,
      'REPORT_EXPORT',
      'Downloaded the synchronized parcel history workbook'
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=CampusParcelHub_History.xlsx');
    res.send(workbook);
  } catch (err) {
    console.error('Error reading parcel history workbook:', err);
    res.status(503).json({ error: 'The parcel history workbook is unavailable. Please contact an administrator.' });
  }
});

async function createWorkbookBuffer(sheetName, rows, columns) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns.map(({ header, width }) => ({
    header,
    key: header,
    width
  }));
  worksheet.addRows(rows);
  return workbook.xlsx.writeBuffer();
}

router.use(requireAdmin);

// Download Excel of Delivered Parcels
router.get('/delivered', async (req, res) => {
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
      WHERE status = 'Delivered'
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
      query += ` AND date(delivered_at) >= date(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date(delivered_at) <= date(?)`;
      params.push(endDate);
    }
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (person_name LIKE ? OR phone LIKE ? OR app_name LIKE ? OR rack_no LIKE ? OR tracking_id LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY delivered_at DESC`;

    const records = await db.all(query, params);

    // Transform into user-friendly Excel rows
    const excelRows = records.map((p, idx) => ({
      'Record #': idx + 1,
      'Parcel ID': `CPH-${String(p.id).padStart(5, '0')}`,
      'Recipient Name': p.person_name,
      'Phone Number': p.phone,
      'Carrier App': p.app_name,
      'Tracking Number': p.tracking_id || 'N/A',
      'Assigned Storage Rack': p.rack_no,
      'Received Date & Time': p.received_at,
      'Intake Guard': p.received_by,
      'Delivered Date & Time': p.delivered_at,
      'Handover Guard': p.delivered_by,
      'Verification / Handover Notes': p.recipient_note || 'Verified & Handed over',
      'Audit Status': 'VERIFIED DELIVERED'
    }));

    const columnWidths = [
      { header: 'Record #', width: 10 },
      { header: 'Parcel ID', width: 14 },
      { header: 'Recipient Name', width: 22 },
      { header: 'Phone Number', width: 14 },
      { header: 'Carrier App', width: 14 },
      { header: 'Tracking Number', width: 24 },
      { header: 'Assigned Storage Rack', width: 22 },
      { header: 'Received Date & Time', width: 22 },
      { header: 'Intake Guard', width: 16 },
      { header: 'Delivered Date & Time', width: 22 },
      { header: 'Handover Guard', width: 16 },
      { header: 'Verification / Handover Notes', width: 30 },
      { header: 'Audit Status', width: 20 },
    ];
    const buffer = await createWorkbookBuffer('Delivered Parcels', excelRows, columnWidths);
    const filenameDate = new Date().toISOString().split('T')[0];

    await logAudit(
      req.user.id,
      req.user.username,
      'REPORT_EXPORT',
      `Exported official delivery audit spreadsheet (${records.length} records)`
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CampusParcelHub_Delivered_${filenameDate}.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generating Excel export:', err);
    res.status(500).json({ error: 'Failed to generate delivery audit Excel report.' });
  }
});

// Download Excel of Overdue Parcels (> 7 Days)
router.get('/overdue', async (req, res) => {
  try {
    const overdueRecords = await db.all(`
      SELECT 
        id, 
        person_name, 
        phone, 
        app_name, 
        tracking_id, 
        rack_no, 
        received_at, 
        received_by,
        CAST((julianday('now') - julianday(received_at)) AS INTEGER) as days_waiting
      FROM parcels 
      WHERE status = 'Pending' AND (julianday('now') - julianday(received_at)) >= 7
      ORDER BY days_waiting DESC
    `);

    const excelRows = overdueRecords.map((p, idx) => ({
      'Alert #': idx + 1,
      'Parcel ID': `CPH-${String(p.id).padStart(5, '0')}`,
      'Days Waiting': `${p.days_waiting} Days Overdue`,
      'Recipient Student/Faculty': p.person_name,
      'Contact Phone': p.phone,
      'Carrier App': p.app_name,
      'Assigned Rack': p.rack_no,
      'Tracking Number': p.tracking_id || 'N/A',
      'Received Timestamp': p.received_at,
      'Intake Guard': p.received_by,
      'Action Mandated': 'Notify Warden / Contact Student Directly'
    }));

    const columnWidths = [
      { header: 'Alert #', width: 8 },
      { header: 'Parcel ID', width: 14 },
      { header: 'Days Waiting', width: 18 },
      { header: 'Recipient Student/Faculty', width: 25 },
      { header: 'Contact Phone', width: 15 },
      { header: 'Carrier App', width: 14 },
      { header: 'Assigned Rack', width: 18 },
      { header: 'Tracking Number', width: 22 },
      { header: 'Received Timestamp', width: 22 },
      { header: 'Intake Guard', width: 16 },
      { header: 'Action Mandated', width: 35 }
    ];
    const buffer = await createWorkbookBuffer('Overdue Packages', excelRows, columnWidths);

    await logAudit(
      req.user.id,
      req.user.username,
      'REPORT_EXPORT',
      `Exported critical overdue parcels report (${overdueRecords.length} records)`
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CampusParcelHub_Overdue_Alert_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate overdue report.' });
  }
});

// Download Excel of Audit Logs
router.get('/audit', async (req, res) => {
  try {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY id DESC');
    const excelRows = logs.map((log) => ({
      'Log ID': log.id,
      'Timestamp': log.timestamp,
      'User': log.username,
      'Security Action': log.action,
      'Details': log.details
    }));

    const columnWidths = [
      { header: 'Log ID', width: 10 },
      { header: 'Timestamp', width: 22 },
      { header: 'User', width: 16 },
      { header: 'Security Action', width: 24 },
      { header: 'Details', width: 50 }
    ];
    const buffer = await createWorkbookBuffer('Security Audit Trail', excelRows, columnWidths);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CampusParcelHub_Security_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate audit report.' });
  }
});

export default router;
