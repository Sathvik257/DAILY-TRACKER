import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireOwnAccount, type AuthRequest } from '../auth.js';

const router = Router();

router.use(requireAuth, requireOwnAccount);

router.get('/', (req: AuthRequest, res) => {
  const user = db
    .prepare('SELECT id, email, name, created_at FROM users WHERE id = ?')
    .get(req.userId!) as { id: string; email: string; name: string; created_at: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

export default router;
