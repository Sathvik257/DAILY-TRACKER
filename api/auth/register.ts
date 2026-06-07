import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../../lib/cors.js';
import { handleRegister } from '../../lib/handlers/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Server not configured. Set JWT_SECRET in environment variables.',
      });
    }
    if (!process.env.TURSO_DATABASE_URL) {
      return res.status(500).json({
        error: 'Database not configured. Set TURSO_DATABASE_URL on Vercel.',
      });
    }

    const result = await handleRegister(req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Register API error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
}
