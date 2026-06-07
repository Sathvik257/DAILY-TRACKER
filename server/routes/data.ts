import { Router } from 'express';
import { db } from '../db.js';
import { DEFAULT_TRACKER_DATA } from '../defaults.js';
import { requireAuth, requireOwnAccount, type AuthRequest } from '../auth.js';
import { rejectCrossUserFields } from '../middleware.js';

const router = Router();

router.use(requireAuth, requireOwnAccount, rejectCrossUserFields);

function readUserData(userId: string) {
  return db
    .prepare('SELECT data FROM tracker_data WHERE user_id = ?')
    .get(userId) as { data: string } | undefined;
}

function writeUserData(userId: string, data: string, updatedAt: string): void {
  const owned = db.prepare('SELECT user_id FROM tracker_data WHERE user_id = ?').get(userId);
  if (owned) {
    db.prepare('UPDATE tracker_data SET data = ?, updated_at = ? WHERE user_id = ?').run(
      data,
      updatedAt,
      userId
    );
  } else {
    db.prepare('INSERT INTO tracker_data (user_id, data, updated_at) VALUES (?, ?, ?)').run(
      userId,
      data,
      updatedAt
    );
  }
}

router.get('/', (req: AuthRequest, res) => {
  const userId = req.userId!;
  const row = readUserData(userId);

  if (!row) {
    res.json(DEFAULT_TRACKER_DATA);
    return;
  }

  try {
    res.json(JSON.parse(row.data));
  } catch {
    res.json(DEFAULT_TRACKER_DATA);
  }
});

router.put('/', (req: AuthRequest, res) => {
  const userId = req.userId!;
  const body = req.body;

  if (!body || typeof body !== 'object' || !body.settings) {
    res.status(400).json({ error: 'Invalid data' });
    return;
  }

  const payload = {
    entries: body.entries ?? {},
    recurringTasks: body.recurringTasks ?? [],
    settings: body.settings,
  };

  const now = new Date().toISOString();
  writeUserData(userId, JSON.stringify(payload), now);

  res.json({ ok: true, updatedAt: now });
});

router.delete('/', (req: AuthRequest, res) => {
  const userId = req.userId!;
  const now = new Date().toISOString();
  writeUserData(userId, JSON.stringify(DEFAULT_TRACKER_DATA), now);
  res.json({ ok: true });
});

export default router;
