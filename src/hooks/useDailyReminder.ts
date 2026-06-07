import { useCallback, useEffect, useRef } from 'react';
import { APP_STORAGE_PREFIX } from '../constants/brand';
import {
  buildReminderMessage,
  hasReminderFiredToday,
  isWithinReminderWindow,
  markReminderFired,
  msUntilNextReminder,
  showReminderNotification,
  syncReminderToServiceWorker,
  todayDateKey,
} from '../utils/reminders';

interface UseDailyReminderOptions {
  userId: string;
  enabled: boolean;
  hour: number;
  minute: number;
  userName: string;
  pendingCount: number;
}

export function useDailyReminder({
  userId,
  enabled,
  hour,
  minute,
  userName,
  pendingCount,
}: UseDailyReminderOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firingRef = useRef(false);
  const scheduleNextRef = useRef<() => void>(() => {});

  const fireReminder = useCallback(async (test = false) => {
    if (!enabled && !test) return;
    if (firingRef.current) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!test && hasReminderFiredToday(userId)) return;

    firingRef.current = true;
    try {
      const { title, body } = buildReminderMessage(userName, pendingCount);
      const tag = test
        ? `${APP_STORAGE_PREFIX}-reminder-test-${userId}`
        : `${APP_STORAGE_PREFIX}-reminder-${userId}-${todayDateKey()}`;
      await showReminderNotification(title, body, tag);
      if (!test) markReminderFired(userId);
    } finally {
      firingRef.current = false;
    }
  }, [enabled, userId, userName, pendingCount]);

  const sendTestReminder = useCallback(() => fireReminder(true), [fireReminder]);

  const checkAndMaybeFire = useCallback(() => {
    if (!enabled) return;
    if (Notification.permission !== 'granted') return;
    if (hasReminderFiredToday(userId)) return;

    const now = new Date();
    const matchesExactTime = now.getHours() === hour && now.getMinutes() === minute;

    if (matchesExactTime || isWithinReminderWindow(hour, minute, 15)) {
      void fireReminder();
    }
  }, [enabled, userId, hour, minute, fireReminder]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!enabled || Notification.permission !== 'granted') return;

    const ms = msUntilNextReminder(hour, minute);
    timerRef.current = setTimeout(() => {
      void fireReminder();
      scheduleNextRef.current();
    }, ms + 500);
  }, [enabled, hour, minute, fireReminder]);

  useEffect(() => {
    scheduleNextRef.current = scheduleNext;
  }, [scheduleNext]);

  useEffect(() => {
    syncReminderToServiceWorker({
      userId,
      enabled,
      hour,
      minute,
      userName,
      pendingCount,
    });
  }, [userId, enabled, hour, minute, userName, pendingCount]);

  useEffect(() => {
    checkAndMaybeFire();
    scheduleNext();

    const interval = setInterval(checkAndMaybeFire, 30_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkAndMaybeFire();
        scheduleNext();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkAndMaybeFire, scheduleNext]);

  return { sendTestReminder };
}
