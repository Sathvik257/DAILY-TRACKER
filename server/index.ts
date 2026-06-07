import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertProductionSecret } from './auth.js';
import { APP_NAME } from './brand.js';
import './db.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import meRoutes from './routes/me.js';
import { startReminderScheduler } from './reminderJob.js';
import { isEmailConfigured } from './email.js';

assertProductionSecret();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();

app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: APP_NAME, emailReminders: isEmailConfigured() });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/data', dataRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const distPath = path.join(__dirname, '..', 'dist');
if (isProd) {
  app.use(express.static(distPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`${APP_NAME} server running on http://localhost:${PORT}`);
  if (isProd) console.log('Serving production build from dist/');
  startReminderScheduler();
  if (isEmailConfigured()) {
    console.log('Email reminders enabled (from Daily Tracker)');
  }
});
