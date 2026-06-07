import express from 'express';
import cors from 'cors';
import { APP_NAME } from '../lib/brand.js';
import { getUserIdFromAuth } from '../lib/auth.js';
import { handleLogin, handleRegister } from '../lib/handlers/auth.js';
import { handleDeleteData, handleGetData, handlePutData } from '../lib/handlers/data.js';
import { handleGetMe } from '../lib/handlers/me.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: APP_NAME,
    database: Boolean(process.env.TURSO_DATABASE_URL) || true,
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await handleRegister(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await handleLogin(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/me', async (req, res) => {
  const userId = getUserIdFromAuth(req.headers.authorization);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });
  const result = await handleGetMe(userId);
  res.status(result.status).json(result.body);
});

app.get('/api/data', async (req, res) => {
  const userId = getUserIdFromAuth(req.headers.authorization);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });
  const result = await handleGetData(userId);
  res.status(result.status).json(result.body);
});

app.put('/api/data', async (req, res) => {
  const userId = getUserIdFromAuth(req.headers.authorization);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });
  const result = await handlePutData(userId, req.body);
  res.status(result.status).json(result.body);
});

app.delete('/api/data', async (req, res) => {
  const userId = getUserIdFromAuth(req.headers.authorization);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });
  const result = await handleDeleteData(userId);
  res.status(result.status).json(result.body);
});

app.listen(PORT, () => {
  console.log(`Daily Tracker API (local) http://localhost:${PORT}`);
});
