/// <reference path="../types/jsonwebtoken.d.ts" />
import jwt from 'jsonwebtoken';
import { ensureSchema } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'daily-tracker-dev-secret';

export interface AuthPayload {
  userId: string;
}

export function signToken(userId: string): string {
  if (!JWT_SECRET || JWT_SECRET === 'daily-tracker-dev-secret') {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured');
    }
  }
  return jwt.sign({ userId } satisfies AuthPayload, JWT_SECRET, { expiresIn: '30d' });
}

export function getUserIdFromAuth(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as AuthPayload;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export async function verifyAccount(userId: string): Promise<boolean> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT id FROM users WHERE id = ?',
    args: [userId],
  });
  return result.rows.length > 0;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
