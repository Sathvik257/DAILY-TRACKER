import { createClient, type Client } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function getClient(): Client {
  if (client) return client;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    client = createClient({ url: tursoUrl, authToken: tursoToken });
    return client;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, '..', 'data', 'daily-tracker.db');
  client = createClient({ url: `file:${filePath}` });
  return client;
}

export async function ensureSchema(): Promise<Client> {
  const db = getClient();
  if (!schemaReady) {
    schemaReady = (async () => {
      const statements = [
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS tracker_data (
          user_id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS reminder_log (
          user_id TEXT NOT NULL,
          sent_date TEXT NOT NULL,
          PRIMARY KEY (user_id, sent_date)
        )`,
      ];
      for (const sql of statements) {
        await db.execute(sql);
      }
    })();
  }
  await schemaReady;
  return db;
}

export { getClient };
