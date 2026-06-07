import { format } from 'date-fns';
import { db } from './db.js';
import { sendDailyReminderEmail } from './email.js';

interface UserRow {
  id: string;
  email: string;
  name: string;
  data: string;
}

interface TrackerSettings {
  notificationsEnabled?: boolean;
  reminderHour?: number;
  reminderMinute?: number;
  userName?: string;
}

interface TrackerPayload {
  settings?: TrackerSettings;
  recurringTasks?: { id: string }[];
  entries?: Record<string, { completedTaskIds?: string[] }>;
}

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function alreadySent(userId: string, date: string): boolean {
  const row = db
    .prepare('SELECT 1 FROM reminder_log WHERE user_id = ? AND sent_date = ?')
    .get(userId, date);
  return Boolean(row);
}

function markSent(userId: string, date: string): void {
  db.prepare('INSERT OR IGNORE INTO reminder_log (user_id, sent_date) VALUES (?, ?)').run(userId, date);
}

function countPendingTasks(payload: TrackerPayload): number {
  const tasks = payload.recurringTasks ?? [];
  if (tasks.length === 0) return 0;
  const entry = payload.entries?.[todayKey()];
  const completed = new Set(entry?.completedTaskIds ?? []);
  return tasks.filter((t) => !completed.has(t.id)).length;
}

export async function runEmailReminders(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const date = todayKey();

  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, t.data
       FROM users u
       JOIN tracker_data t ON t.user_id = u.id`
    )
    .all() as UserRow[];

  for (const row of rows) {
    try {
      if (alreadySent(row.id, date)) continue;

      let payload: TrackerPayload;
      try {
        payload = JSON.parse(row.data) as TrackerPayload;
      } catch {
        continue;
      }

      const settings = payload.settings ?? {};
      if (!settings.notificationsEnabled) continue;

      const reminderHour = settings.reminderHour ?? 8;
      const reminderMinute = settings.reminderMinute ?? 0;

      if (hour !== reminderHour || minute !== reminderMinute) continue;

      const pending = countPendingTasks(payload);
      const displayName = settings.userName || row.name;

      const sent = await sendDailyReminderEmail(row.email, displayName, pending);
      if (sent) markSent(row.id, date);
    } catch (err) {
      console.error(`Reminder failed for user ${row.id}:`, err);
    }
  }
}

export function startReminderScheduler(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminder_log (
      user_id TEXT NOT NULL,
      sent_date TEXT NOT NULL,
      PRIMARY KEY (user_id, sent_date)
    );
  `);

  void runEmailReminders();
  setInterval(() => void runEmailReminders(), 60_000);
}
