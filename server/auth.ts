import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sat-dev-secret-change-me';

export interface AuthPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export function assertProductionSecret(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL: Set JWT_SECRET in production. Refusing to start.');
    process.exit(1);
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies AuthPayload, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    if (!payload.userId || typeof payload.userId !== 'string') {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired — sign in again' });
  }
}

/** Ensures the token maps to a real user — prevents access with deleted or forged IDs. */
export function requireOwnAccount(req: AuthRequest, res: Response, next: NextFunction): void {
  const user = db
    .prepare('SELECT id FROM users WHERE id = ?')
    .get(req.userId!) as { id: string } | undefined;

  if (!user) {
    res.status(401).json({ error: 'Account not found' });
    return;
  }

  next();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
