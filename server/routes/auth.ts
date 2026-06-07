import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { DEFAULT_TRACKER_DATA } from '../defaults.js';
import { isValidEmail, signToken } from '../auth.js';
import { sendWelcomeEmail } from '../email.js';

const router = Router();

router.post('/register', async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  const name = String(req.body.name ?? '').trim();

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const id = randomUUID();
  const now = new Date().toISOString();

  const initialData = {
    ...DEFAULT_TRACKER_DATA,
    settings: { ...DEFAULT_TRACKER_DATA.settings, userName: name },
  };

  try {
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, email, hash, name, now);

    db.prepare('INSERT INTO tracker_data (user_id, data, updated_at) VALUES (?, ?, ?)').run(
      id,
      JSON.stringify(initialData),
      now
    );

    const token = signToken(id);
    res.status(201).json({ token, user: { id, email, name } });

    void sendWelcomeEmail(email, name).catch((err) =>
      console.error('Welcome email failed:', err)
    );
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = db
    .prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?')
    .get(email) as { id: string; email: string; name: string; password_hash: string } | undefined;

  if (!user) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    res.status(401).json({ error: 'Wrong email or password' });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default router;
