import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { isValidEmail, signToken } from '../auth.js';
import { DEFAULT_TRACKER_DATA } from '../defaults.js';
import { ensureSchema } from '../db.js';

export async function handleRegister(body: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const name = String(body.name ?? '').trim();

  if (!isValidEmail(email)) {
    return { status: 400, body: { error: 'Enter a valid email address' } };
  }
  if (password.length < 6) {
    return { status: 400, body: { error: 'Password must be at least 6 characters' } };
  }

  const db = await ensureSchema();
  const hash = await bcrypt.hash(password, 10);
  const id = randomUUID();
  const now = new Date().toISOString();

  const initialData = {
    ...DEFAULT_TRACKER_DATA,
    settings: {
      ...DEFAULT_TRACKER_DATA.settings,
      userName: name,
      displayName: name,
    },
  };

  try {
    await db.execute({
      sql: 'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, email, hash, name, now],
    });
    await db.execute({
      sql: 'INSERT INTO tracker_data (user_id, data, updated_at) VALUES (?, ?, ?)',
      args: [id, JSON.stringify(initialData), now],
    });

    const token = signToken(id);
    return {
      status: 201,
      body: { token, user: { id, email, name } },
    };
  } catch (err: unknown) {
    const message = String(err);
    if (message.includes('UNIQUE') || message.includes('unique')) {
      return { status: 409, body: { error: 'An account with this email already exists' } };
    }
    console.error('Register error:', err);
    return { status: 500, body: { error: 'Could not create account. Check server configuration.' } };
  }
}

export async function handleLogin(body: { email?: string; password?: string }) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !password) {
    return { status: 400, body: { error: 'Email and password required' } };
  }

  const db = await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT id, email, name, password_hash FROM users WHERE email = ?',
    args: [email],
  });

  if (result.rows.length === 0) {
    return { status: 401, body: { error: 'Wrong email or password' } };
  }

  const row = result.rows[0];
  const ok = await bcrypt.compare(password, String(row.password_hash));
  if (!ok) {
    return { status: 401, body: { error: 'Wrong email or password' } };
  }

  const token = signToken(String(row.id));
  return {
    status: 200,
    body: {
      token,
      user: { id: String(row.id), email: String(row.email), name: String(row.name) },
    },
  };
}
