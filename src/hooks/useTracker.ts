import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { fetchData, resetServerData, saveData as saveDataApi } from '../api/client';
import type { AppSettings, AppView, DailyEntry, Expense, ExpenseCategory, RecurringTask } from '../types';
import { analyzeDay, getMonthCalendarData, getRecentEntries } from '../utils/analysis';
import { computeBudget } from '../utils/budget';
import { createEmptyEntry, exportDataJson, importDataJson } from '../utils/storage';
import { allTasksDone, countCompleted, getDayTasks } from '../utils/tasks';

function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function useTracker(enabled: boolean) {
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [view, setView] = useState<AppView>('today');
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    dailyBudget: 500,
    monthlyBudget: 15000,
    currency: '₹',
    userName: '',
    notificationsEnabled: false,
    reminderHour: 8,
    reminderMinute: 0,
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'loading'>('loading');
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const entry = useMemo(() => {
    return entries[selectedDate] ?? createEmptyEntry(selectedDate);
  }, [entries, selectedDate]);

  const tasks = useMemo(() => getDayTasks(recurringTasks, entry), [recurringTasks, entry]);

  const isToday = selectedDate === todayKey();

  useEffect(() => {
    if (!enabled) return;

    setSaveStatus('loading');
    setHydrated(false);

    fetchData()
      .then((data) => {
        setEntries(data.entries ?? {});
        setRecurringTasks(data.recurringTasks ?? []);
        setSettings(data.settings);
        setHydrated(true);
        setSaveStatus('saved');
      })
      .catch(() => {
        setSaveStatus('saved');
        setHydrated(true);
      });
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !hydrated) return;

    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      saveDataApi({ entries, recurringTasks, settings })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('saved'));
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [entries, recurringTasks, settings, enabled, hydrated]);

  const updateEntry = useCallback(
    (updater: (e: DailyEntry) => DailyEntry) => {
      setEntries((prev) => {
        const current = prev[selectedDate] ?? createEmptyEntry(selectedDate);
        return { ...prev, [selectedDate]: updater(current) };
      });
    },
    [selectedDate]
  );

  const addTask = useCallback((text: string) => {
    const task: RecurringTask = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setRecurringTasks((prev) => [...prev, task]);
  }, []);

  const editTask = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecurringTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t)));
  }, []);

  const toggleTask = useCallback(
    (id: string) => {
      updateEntry((e) => {
        const set = new Set(e.completedTaskIds);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return { ...e, completedTaskIds: Array.from(set) };
      });
    },
    [updateEntry]
  );

  const removeTask = useCallback((id: string) => {
    setRecurringTasks((prev) => prev.filter((t) => t.id !== id));
    setEntries((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = {
          ...next[key],
          completedTaskIds: next[key].completedTaskIds.filter((cid) => cid !== id),
        };
      }
      return next;
    });
  }, []);

  const addExpense = useCallback(
    (amount: number, category: ExpenseCategory, note: string) => {
      const expense: Expense = {
        id: crypto.randomUUID(),
        amount,
        category,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };
      updateEntry((e) => ({ ...e, expenses: [...e.expenses, expense] }));
    },
    [updateEntry]
  );

  const removeExpense = useCallback(
    (id: string) => {
      updateEntry((e) => ({ ...e, expenses: e.expenses.filter((x) => x.id !== id) }));
    },
    [updateEntry]
  );

  const updateJournal = useCallback(
    (journal: string) => updateEntry((e) => ({ ...e, journal })),
    [updateEntry]
  );

  const updateReflection = useCallback(
    (reflection: string) => updateEntry((e) => ({ ...e, reflection })),
    [updateEntry]
  );

  const updateMood = useCallback(
    (mood: number) => updateEntry((e) => ({ ...e, mood })),
    [updateEntry]
  );

  const updateSleep = useCallback(
    (sleepHours: number) => updateEntry((e) => ({ ...e, sleepHours })),
    [updateEntry]
  );

  const updateWater = useCallback(
    (waterGlasses: number) => updateEntry((e) => ({ ...e, waterGlasses })),
    [updateEntry]
  );

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(todayKey());
    setView('today');
  }, []);

  const exportBackup = useCallback(() => {
    return exportDataJson({ entries, recurringTasks, settings });
  }, [entries, recurringTasks, settings]);

  const importBackup = useCallback((json: string) => {
    const data = importDataJson(json);
    setEntries(data.entries);
    setRecurringTasks(data.recurringTasks);
    setSettings(data.settings);
  }, []);

  const resetAll = useCallback(async () => {
    await resetServerData();
    const data = await fetchData();
    setEntries(data.entries ?? {});
    setRecurringTasks(data.recurringTasks ?? []);
    setSettings(data.settings);
    setSelectedDate(todayKey());
    setView('today');
  }, []);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((countCompleted(tasks) / tasks.length) * 100);
  }, [tasks]);

  const expenseTotal = useMemo(
    () => entry.expenses.reduce((s, e) => s + e.amount, 0),
    [entry.expenses]
  );

  const monthExpenseTotal = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return Object.entries(entries).reduce((sum, [dateKey, day]) => {
      const d = new Date(dateKey);
      if (d.getFullYear() === year && d.getMonth() === month) {
        return sum + day.expenses.reduce((s, e) => s + e.amount, 0);
      }
      return sum;
    }, 0);
  }, [entries]);

  const budget = useMemo(
    () =>
      computeBudget(entries, selectedDate, settings.dailyBudget, settings.monthlyBudget, settings.currency),
    [entries, selectedDate, settings.dailyBudget, settings.monthlyBudget, settings.currency]
  );

  const analysis = useMemo(() => {
    const recent = getRecentEntries(entries, recurringTasks, selectedDate, 7);
    return analyzeDay(entry, tasks, settings.dailyBudget, recent, settings.currency);
  }, [entry, tasks, entries, recurringTasks, selectedDate, settings.dailyBudget, settings.currency]);

  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    const today = todayKey();

    const todayEntry = entries[today] ?? createEmptyEntry(today);
    const todayTasks = getDayTasks(recurringTasks, todayEntry);
    const todayDone = allTasksDone(todayTasks);

    if (!todayDone) {
      d.setDate(d.getDate() - 1);
    }

    while (true) {
      const key = format(d, 'yyyy-MM-dd');
      const dayEntry = entries[key] ?? createEmptyEntry(key);
      const dayTasks = getDayTasks(recurringTasks, dayEntry);
      if (dayTasks.length === 0) break;
      if (!allTasksDone(dayTasks)) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [entries, recurringTasks]);

  const weekStats = useMemo(() => {
    const days: { date: string; tasks: number; done: number; spent: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      const dayEntry = entries[key] ?? createEmptyEntry(key);
      const dayTasks = getDayTasks(recurringTasks, dayEntry);
      days.push({
        date: key,
        tasks: dayTasks.length,
        done: countCompleted(dayTasks),
        spent: dayEntry.expenses.reduce((s, e) => s + e.amount, 0),
      });
    }
    return days;
  }, [entries, recurringTasks]);

  const monthCalendar = useMemo(() => {
    const now = new Date();
    return getMonthCalendarData(entries, recurringTasks, now.getFullYear(), now.getMonth());
  }, [entries, recurringTasks]);

  const consistencyRate = useMemo(() => {
    const active = monthCalendar.filter((d) => d.status !== 'future' && d.status !== 'empty');
    if (active.length === 0) return 0;
    const done = active.filter((d) => d.status === 'done').length;
    return Math.round((done / active.length) * 100);
  }, [monthCalendar]);

  return {
    selectedDate,
    setSelectedDate,
    view,
    setView,
    entry,
    tasks,
    settings,
    isToday,
    progress,
    expenseTotal,
    monthExpenseTotal,
    budget,
    analysis,
    streak,
    weekStats,
    monthCalendar,
    consistencyRate,
    saveStatus,
    hydrated,
    addTask,
    editTask,
    toggleTask,
    removeTask,
    addExpense,
    removeExpense,
    updateJournal,
    updateReflection,
    updateMood,
    updateSleep,
    updateWater,
    updateSettings,
    goToToday,
    exportBackup,
    importBackup,
    resetAll,
  };
}
