import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';
import { syncParcelHistoryWorkbook } from './historyWorkbook.js';

function getPastDate(daysAgo, hoursAgo = 0, minutesAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function getTodayTime(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

export async function seedDatabase() {
  console.log('[SEED] Starting database initialization and seeding...');
  await initDb();

  // Clear existing records to ensure fresh state
  await db.exec(`
    DELETE FROM parcels;
    DELETE FROM users;
    DELETE FROM racks;
    DELETE FROM delivery_apps;
    DELETE FROM audit_logs;
  `);

  // 1. Seed Users
  const adminPass = await bcrypt.hash('admin123', 10);
  const staffPass = await bcrypt.hash('staff123', 10);

  await db.run(
    'INSERT INTO users (username, password_hash, full_name, badge_id, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    ['admin', adminPass, 'Cmdr. Sunil Sharma', 'CMD-01', 'admin']
  );
  await db.run(
    'INSERT INTO users (username, password_hash, full_name, badge_id, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    ['guard_rajesh', staffPass, 'Officer Rajesh Kumar', 'SEC-104', 'staff']
  );
  console.log('[SEED] One admin and one security account seeded.');

  // 2. Seed Delivery Apps
  const apps = [
    { name: 'Amazon', color: '#ff9900' },
    { name: 'Flipkart', color: '#2874f0' },
    { name: 'Meesho', color: '#f43397' },
    { name: 'Myntra', color: '#ff3f6c' },
    { name: 'BlueDart', color: '#003399' },
    { name: 'Delhivery', color: '#e60000' },
    { name: 'Other', color: '#00f0ff' }
  ];

  for (const app of apps) {
    await db.run('INSERT INTO delivery_apps (name, color_code, is_active) VALUES (?, ?, 1)', [app.name, app.color]);
  }
  console.log('[SEED] Delivery carriers seeded.');

  // 3. Seed Storage Racks
  const racks = [
    { code: 'RACK A-01', zone: 'North Gate Main Security', capacity: 25 },
    { code: 'RACK A-02', zone: 'North Gate Main Security', capacity: 25 },
    { code: 'RACK A-03', zone: 'North Gate Main Security', capacity: 25 },
    { code: 'RACK B-01', zone: 'Hostel Block East Hub', capacity: 30 },
    { code: 'RACK B-02', zone: 'Hostel Block East Hub', capacity: 30 },
    { code: 'RACK C-01', zone: 'Faculty & Admin Wing', capacity: 20 },
    { code: 'RACK C-02', zone: 'Faculty & Admin Wing', capacity: 20 },
    { code: 'RACK D-01', zone: 'Long-term / Vault Archive', capacity: 15 }
  ];

  for (const r of racks) {
    await db.run('INSERT INTO racks (rack_code, zone, capacity, is_active) VALUES (?, ?, ?, 1)', [r.code, r.zone, r.capacity]);
  }
  console.log('[SEED] Storage racks seeded.');

  // 4. Seed Parcels
  // A. Today's Pending Arrivals (Fresh)
  const freshParcels = [
    {
      person_name: 'Aarav Patel (CS 3rd Yr)',
      phone: '9876543210',
      app_name: 'Amazon',
      tracking_id: 'AMZ-IN-8891023',
      rack_no: 'RACK A-01',
      received_at: getTodayTime(9, 15),
      received_by: 'guard_rajesh',
      status: 'Pending'
    },
    {
      person_name: 'Prof. K. Venkatesh (Mech Dept)',
      phone: '9123456780',
      app_name: 'Flipkart',
      tracking_id: 'FK-EXP-449102',
      rack_no: 'RACK C-01',
      received_at: getTodayTime(10, 40),
      received_by: 'guard_rajesh',
      status: 'Pending'
    },
    {
      person_name: 'Ananya Deshmukh (Biotech)',
      phone: '9988776655',
      app_name: 'Myntra',
      tracking_id: 'MYN-DEL-77821',
      rack_no: 'RACK B-01',
      received_at: getTodayTime(11, 5),
      received_by: 'guard_rajesh',
      status: 'Pending'
    }
  ];

  // B. Moderate Wait Parcels (2 to 5 days old)
  const moderateParcels = [
    {
      person_name: 'Rohan Mehra (Civil 2nd Yr)',
      phone: '9822334455',
      app_name: 'Meesho',
      tracking_id: 'MSH-83910023',
      rack_no: 'RACK A-02',
      received_at: getPastDate(3, 2, 15),
      received_by: 'guard_rajesh',
      status: 'Pending'
    },
    {
      person_name: 'Dr. Sunita Rao (Dean Office)',
      phone: '9443322110',
      app_name: 'BlueDart',
      tracking_id: 'BLU-99210344',
      rack_no: 'RACK C-01',
      received_at: getPastDate(4, 5, 0),
      received_by: 'guard_rajesh',
      status: 'Pending'
    },
    {
      person_name: 'Kabir Singhania (MBA 1st Yr)',
      phone: '9765432109',
      app_name: 'Amazon',
      tracking_id: 'AMZ-IN-332918',
      rack_no: 'RACK B-02',
      received_at: getPastDate(5, 3, 20),
      received_by: 'guard_rajesh',
      status: 'Pending'
    }
  ];

  // C. Urgent > 7 Days Parcels (Highlight & Alarm trigger)
  const overdueParcels = [
    {
      person_name: 'Vikramaditya Bose (Hostel 4, Rm 212)',
      phone: '9811223344',
      app_name: 'Delhivery',
      tracking_id: 'DEL-9910245',
      rack_no: 'RACK D-01',
      received_at: getPastDate(9, 4, 30), // 9 days ago
      received_by: 'guard_rajesh',
      status: 'Pending'
    },
    {
      person_name: 'Sneha Kulkarni (ECE 4th Yr)',
      phone: '9900112233',
      app_name: 'Meesho',
      tracking_id: 'MSH-55443321',
      rack_no: 'RACK D-01',
      received_at: getPastDate(12, 6, 10), // 12 days ago
      received_by: 'guard_rajesh',
      status: 'Pending'
    },
    {
      person_name: 'Aditya Chawla (Hostel 2, Rm 105)',
      phone: '9845012345',
      app_name: 'Amazon',
      tracking_id: 'AMZ-IN-1122990',
      rack_no: 'RACK A-03',
      received_at: getPastDate(8, 1, 0), // 8 days ago
      received_by: 'guard_rajesh',
      status: 'Pending'
    }
  ];

  // D. Delivered Parcels (Permanent History)
  const deliveredParcels = [
    {
      person_name: 'Tanya Sen (Architecture)',
      phone: '9871122334',
      app_name: 'Amazon',
      tracking_id: 'AMZ-IN-4455667',
      rack_no: 'RACK A-01',
      received_at: getTodayTime(8, 30),
      received_by: 'guard_rajesh',
      status: 'Delivered',
      delivered_at: getTodayTime(10, 50),
      delivered_by: 'guard_rajesh',
      recipient_note: 'Verified with Student ID Card #ARCH-2023-44'
    },
    {
      person_name: 'Manish Verma (Electrical Eng)',
      phone: '9812345678',
      app_name: 'Flipkart',
      tracking_id: 'FK-DEL-99234',
      rack_no: 'RACK B-01',
      received_at: getPastDate(1, 4, 0),
      received_by: 'guard_rajesh',
      status: 'Delivered',
      delivered_at: getPastDate(1, 1, 15),
      delivered_by: 'guard_rajesh',
      recipient_note: 'OTP verified on registered mobile'
    },
    {
      person_name: 'Pooja Hegde (Design School)',
      phone: '9765123456',
      app_name: 'Myntra',
      tracking_id: 'MYN-EXP-1129',
      rack_no: 'RACK A-02',
      received_at: getPastDate(2, 6, 0),
      received_by: 'guard_rajesh',
      status: 'Delivered',
      delivered_at: getPastDate(2, 2, 0),
      delivered_by: 'admin',
      recipient_note: 'Handed over directly to student'
    },
    {
      person_name: 'Harish Chandra (Physics Lab)',
      phone: '9654321987',
      app_name: 'BlueDart',
      tracking_id: 'BLU-882910',
      rack_no: 'RACK C-02',
      received_at: getPastDate(6, 4, 0),
      received_by: 'guard_rajesh',
      status: 'Delivered',
      delivered_at: getPastDate(5, 7, 0),
      delivered_by: 'guard_rajesh',
      recipient_note: 'Faculty signature recorded in physical ledger'
    }
  ];

  const allParcels = [...freshParcels, ...moderateParcels, ...overdueParcels, ...deliveredParcels];

  for (const p of allParcels) {
    await db.run(
      `INSERT INTO parcels (
        person_name, phone, app_name, tracking_id, rack_no, received_at, received_by, status, delivered_at, delivered_by, recipient_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.person_name,
        p.phone,
        p.app_name,
        p.tracking_id,
        p.rack_no,
        p.received_at,
        p.received_by,
        p.status,
        p.delivered_at || null,
        p.delivered_by || null,
        p.recipient_note || null
      ]
    );
  }

  console.log(`[SEED] ${allParcels.length} realistic parcels seeded.`);

  // 5. Seed Audit Logs
  const auditEntries = [
    { user: 'admin', action: 'SYSTEM_BOOT', details: 'Campus Parcel Hub Command Center initialized and security policies loaded.' },
    { user: 'guard_rajesh', action: 'LOGIN', details: 'Officer Rajesh Kumar logged into North Gate post.' },
    { user: 'guard_rajesh', action: 'PARCEL_INTAKE', details: 'Intake: Amazon package for Aarav Patel -> RACK A-01' },
    { user: 'guard_rajesh', action: 'PARCEL_INTAKE', details: 'Intake: Flipkart package for Prof. K. Venkatesh -> RACK C-01' },
    { user: 'guard_rajesh', action: 'PARCEL_DELIVERED', details: 'Delivered parcel to Tanya Sen (ID: ARCH-2023-44)' },
    { user: 'admin', action: 'RACK_AUDIT', details: 'Routine rack inspection confirmed North Gate racks at 35% capacity.' }
  ];

  for (const a of auditEntries) {
    await db.run(
      'INSERT INTO audit_logs (username, action, details, timestamp) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [a.user, a.action, a.details]
    );
  }

  await syncParcelHistoryWorkbook();
  console.log('[SEED] Database seeding complete and ready for operations!');
}

// Auto-run if executed directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
