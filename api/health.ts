import type { VercelRequest, VercelResponse } from '@vercel/node';
import { APP_NAME } from '../lib/brand.js';
import { setCors } from '../lib/cors.js';
import { ensureSchema } from '../lib/db.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  setCors(res);

  const hasJwt = Boolean(process.env.JWT_SECRET);
  const hasTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

  let databaseOk = false;
  if (hasTurso) {
    try {
      await ensureSchema();
      databaseOk = true;
    } catch (err) {
      console.error('Health DB check failed:', err);
    }
  }

  res.status(200).json({
    ok: hasJwt && databaseOk,
    name: APP_NAME,
    jwt: hasJwt,
    database: databaseOk,
    configured: hasJwt && hasTurso,
  });
}
