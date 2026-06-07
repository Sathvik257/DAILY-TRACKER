import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserIdFromAuth } from '../lib/auth.js';
import { setCors } from '../lib/cors.js';
import { handleDeleteData, handleGetData, handlePutData } from '../lib/handlers/data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = getUserIdFromAuth(req.headers.authorization);
  if (!userId) return res.status(401).json({ error: 'Not signed in' });

  try {
    if (req.method === 'GET') {
      const result = await handleGetData(userId);
      return res.status(result.status).json(result.body);
    }
    if (req.method === 'PUT') {
      const result = await handlePutData(userId, (req.body ?? {}) as Record<string, unknown>);
      return res.status(result.status).json(result.body);
    }
    if (req.method === 'DELETE') {
      const result = await handleDeleteData(userId);
      return res.status(result.status).json(result.body);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Data API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
