import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserIdFromAuth } from '../lib/auth.js';
import { setCors } from '../lib/cors.js';
import { handleGetMe } from '../lib/handlers/me.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = getUserIdFromAuth(req.headers.authorization);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });

  try {
    const result = await handleGetMe(userId);
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Me API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
