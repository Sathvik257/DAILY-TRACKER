import { verifyAccount } from '../auth.js';
import { DEFAULT_TRACKER_DATA } from '../defaults.js';
import { ensureSchema } from '../db.js';

const FORBIDDEN_KEYS = new Set(['userId', 'user_id', 'ownerId', 'owner_id', 'email', 'password']);

function rejectCrossUserFields(body: Record<string, unknown>): boolean {
  return Object.keys(body).some((k) => FORBIDDEN_KEYS.has(k));
}

export async function handleGetData(userId: string) {
  if (!(await verifyAccount(userId))) {
    return { status: 401, body: { error: 'Account not found' } };
  }

  const db = await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT data FROM tracker_data WHERE user_id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) {
    return { status: 200, body: DEFAULT_TRACKER_DATA };
  }

  try {
    return { status: 200, body: JSON.parse(String(result.rows[0].data)) };
  } catch {
    return { status: 200, body: DEFAULT_TRACKER_DATA };
  }
}

export async function handlePutData(userId: string, body: Record<string, unknown>) {
  if (!(await verifyAccount(userId))) {
    return { status: 401, body: { error: 'Account not found' } };
  }
  if (!body || typeof body !== 'object' || !body.settings) {
    return { status: 400, body: { error: 'Invalid data' } };
  }
  if (rejectCrossUserFields(body)) {
    return { status: 400, body: { error: 'Invalid request' } };
  }

  const payload = {
    entries: body.entries ?? {},
    recurringTasks: body.recurringTasks ?? [],
    settings: body.settings,
  };

  const now = new Date().toISOString();
  const db = await ensureSchema();

  await db.execute({
    sql: `INSERT INTO tracker_data (user_id, data, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [userId, JSON.stringify(payload), now],
  });

  return { status: 200, body: { ok: true, updatedAt: now } };
}

export async function handleDeleteData(userId: string) {
  if (!(await verifyAccount(userId))) {
    return { status: 401, body: { error: 'Account not found' } };
  }

  const now = new Date().toISOString();
  const db = await ensureSchema();

  await db.execute({
    sql: 'UPDATE tracker_data SET data = ?, updated_at = ? WHERE user_id = ?',
    args: [JSON.stringify(DEFAULT_TRACKER_DATA), now, userId],
  });

  return { status: 200, body: { ok: true } };
}
