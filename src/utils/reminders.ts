import { APP_NAME, APP_STORAGE_PREFIX } from '../constants/brand';

export interface ReminderConfig {
  userId: string;
  enabled: boolean;
  hour: number;
  minute: number;
  userName: string;
  pendingCount: number;
}

function storageKey(userId: string, date: string): string {
  return `${APP_STORAGE_PREFIX}-reminder:${userId}:${date}`;
}

export function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function hasReminderFiredToday(userId: string): boolean {
  return localStorage.getItem(storageKey(userId, todayDateKey())) === '1';
}

export function markReminderFired(userId: string): void {
  localStorage.setItem(storageKey(userId, todayDateKey()), '1');
}

export function buildReminderMessage(userName: string, pendingCount: number): { title: string; body: string } {
  const greeting = userName ? `${userName}, ` : '';
  if (pendingCount > 0) {
    return {
      title: APP_NAME,
      body: `${greeting}you have ${pendingCount} task${pendingCount > 1 ? 's' : ''} open today.`,
    };
  }
  return {
    title: APP_NAME,
    body: `${greeting}time to log your tasks and spending for today.`,
  };
}

export function msUntilNextReminder(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

export function isWithinReminderWindow(hour: number, minute: number, windowMinutes = 30): boolean {
  const now = new Date();
  const start = new Date();
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + windowMinutes * 60_000);
  return now >= start && now < end;
}

export async function showReminderNotification(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg?.active) {
      reg.active.postMessage({ type: 'SHOW_REMINDER', title, body, tag });
      return;
    }
  }

  new Notification(title, { body, icon: '/favicon.svg', tag });
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function syncReminderToServiceWorker(config: ReminderConfig): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      reg.active?.postMessage({ type: 'REMINDER_CONFIG', config });
    })
    .catch(() => {});
}
