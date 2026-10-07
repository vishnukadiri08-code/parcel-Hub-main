import express from 'express';
import cors from 'cors';
import { db, initDb } from './db.js';
import authRoutes from './routes/auth.js';
import parcelRoutes from './routes/parcels.js';
import adminRoutes from './routes/admin.js';
import exportRoutes from './routes/export.js';
import { syncParcelHistoryWorkbook } from './historyWorkbook.js';
import { seedDatabase } from './seed.js';

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map((origin) => origin.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logger for command center audit inspection
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Campus Parcel Hub Command Center Engine',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy.' });
  }

  console.error('[UNHANDLED_ERROR]', err);
  res.status(500).json({ error: 'Internal system fault in command engine.' });
});

async function ensureSeedData() {
  try {
    const row = await db.get('SELECT COUNT(*) as count FROM users');
    if (!row || Number(row.count) === 0) {
      console.log('[BOOT] No users found. Running the initial database seed...');
      await seedDatabase();
    } else {
      console.log('[BOOT] Existing user records detected. Retaining current database state.');
    }
  } catch (error) {
    console.error('[BOOT] Failed to validate database seed state:', error);
    throw error;
  }
}

async function startServer() {
  try {
    await initDb();
    await ensureSeedData();
    await syncParcelHistoryWorkbook();
    app.listen(PORT, HOST, () => {
      console.log(`🚀 [CAMPUS PARCEL HUB API] Running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();
