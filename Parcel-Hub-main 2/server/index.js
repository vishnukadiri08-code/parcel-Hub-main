import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import parcelRoutes from './routes/parcels.js';
import adminRoutes from './routes/admin.js';
import exportRoutes from './routes/export.js';
import { syncParcelHistoryWorkbook } from './historyWorkbook.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('[UNHANDLED_ERROR]', err);
  res.status(500).json({ error: 'Internal system fault in command engine.' });
});

async function startServer() {
  try {
    await initDb();
    await syncParcelHistoryWorkbook();
    app.listen(PORT, () => {
      console.log(`🚀 [CAMPUS PARCEL HUB API] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();
