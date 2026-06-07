import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';

const FORBIDDEN_BODY_KEYS = new Set([
  'userId',
  'user_id',
  'ownerId',
  'owner_id',
  'email',
  'password',
  'password_hash',
]);

/** Reject requests that try to pass another user's id in the body. */
export function rejectCrossUserFields(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object') {
    next();
    return;
  }

  for (const key of Object.keys(req.body)) {
    if (FORBIDDEN_BODY_KEYS.has(key)) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }
  }

  next();
}
