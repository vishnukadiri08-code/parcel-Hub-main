import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const dataDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
export const historyWorkbookPath = path.join(dataDirectory, 'parcel_history.xlsx');

let pendingSync = Promise.resolve();

export function syncParcelHistoryWorkbook() {
  const nextSync = pendingSync.catch(() => {}).then(async () => {
    const parcels = await db.all(`
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
      ORDER BY received_at DESC, id DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Parcel History');
    worksheet.columns = [
      { header: 'Parcel ID', key: 'parcelId', width: 14 },
      { header: 'Recipient Name', key: 'personName', width: 26 },
      { header: 'Phone Number', key: 'phone', width: 16 },
      { header: 'Carrier App', key: 'appName', width: 16 },
      { header: 'Tracking Number', key: 'trackingId', width: 24 },
      { header: 'Storage Rack', key: 'rackNo', width: 18 },
      { header: 'Received Date & Time', key: 'receivedAt', width: 22 },
      { header: 'Intake Staff', key: 'receivedBy', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Delivered Date & Time', key: 'deliveredAt', width: 22 },
      { header: 'Handover Staff', key: 'deliveredBy', width: 18 },
      { header: 'Handover Notes', key: 'recipientNote', width: 40 }
    ];
    worksheet.addRows(parcels.map((parcel) => ({
      parcelId: `CPH-${String(parcel.id).padStart(5, '0')}`,
      personName: parcel.person_name,
      phone: parcel.phone,
      appName: parcel.app_name,
      trackingId: parcel.tracking_id || '',
      rackNo: parcel.rack_no,
      receivedAt: parcel.received_at,
      receivedBy: parcel.received_by,
      status: parcel.status,
      deliveredAt: parcel.delivered_at || '',
      deliveredBy: parcel.delivered_by || '',
      recipientNote: parcel.recipient_note || ''
    })));

    await fs.mkdir(dataDirectory, { recursive: true });
    const temporaryPath = `${historyWorkbookPath}.${process.pid}.tmp`;
    try {
      await workbook.xlsx.writeFile(temporaryPath);
      await fs.rename(temporaryPath, historyWorkbookPath);
    } catch (error) {
      try {
        await fs.rm(temporaryPath, { force: true });
      } catch (cleanupError) {
        console.error('Failed to clean up temporary history workbook:', cleanupError);
      }
      throw error;
    }

    console.log(`[HISTORY] Excel workbook synchronized (${parcels.length} parcels).`);
    return parcels.length;
  });

  pendingSync = nextSync;
  return nextSync;
}
