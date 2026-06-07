import { ensureSchema } from '../db.js';

export async function handleGetMe(userId: string) {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT id, email, name, created_at FROM users WHERE id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) {
    return { status: 404, body: { error: 'User not found' } };
  }

  const row = result.rows[0];
  return {
    status: 200,
    body: {
      user: {
        id: String(row.id),
        email: String(row.email),
        name: String(row.name),
        created_at: String(row.created_at),
      },
    },
  };
}
