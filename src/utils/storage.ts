import type { AppSettings, DailyEntry, RecurringTask, StoredData, Task } from '../types';
import { DEFAULT_CURRENCY, DEFAULT_DAILY_BUDGET, DEFAULT_MONTHLY_BUDGET } from './currency';

const LEGACY_STORAGE_KEY = 'daily-tracker-data';

const defaultSettings: AppSettings = {
  dailyBudget: DEFAULT_DAILY_BUDGET,
  monthlyBudget: DEFAULT_MONTHLY_BUDGET,
  currency: DEFAULT_CURRENCY,
  userName: '',
  notificationsEnabled: false,
  reminderHour: 8,
  reminderMinute: 0,
};

type LegacyEntry = DailyEntry & { tasks?: Task[] };

/** Remove old browser-only data so it never mixes between accounts on the same device. */
export function clearLegacyLocalStorage(): void {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function createEmptyEntry(date: string): DailyEntry {
  return {
    date,
    completedTaskIds: [],
    expenses: [],
    journal: '',
    reflection: '',
    mood: 3,
    sleepHours: 7,
    waterGlasses: 0,
  };
}

function migrateEntry(entry: LegacyEntry): DailyEntry {
  const base = createEmptyEntry(entry.date);
  const { tasks: _tasks, ...rest } = entry;
  return {
    ...base,
    ...rest,
    completedTaskIds: entry.completedTaskIds ?? [],
    reflection: entry.reflection ?? '',
  };
}

function extractRecurringTasks(entries: Record<string, LegacyEntry>): RecurringTask[] {
  const byText = new Map<string, RecurringTask>();

  for (const entry of Object.values(entries)) {
    for (const t of entry.tasks ?? []) {
      if (!byText.has(t.text)) {
        byText.set(t.text, { id: t.id, text: t.text, createdAt: t.createdAt });
      }
    }
  }

  return Array.from(byText.values());
}

function migrateEntries(
  rawEntries: Record<string, LegacyEntry>,
  recurringTasks: RecurringTask[]
): Record<string, DailyEntry> {
  const entries: Record<string, DailyEntry> = {};

  for (const [key, raw] of Object.entries(rawEntries)) {
    let completedTaskIds = raw.completedTaskIds ?? [];

    if (raw.tasks && raw.tasks.length > 0 && completedTaskIds.length === 0) {
      completedTaskIds = raw.tasks
        .filter((t) => t.completed)
        .map((t) => {
          const match = recurringTasks.find((r) => r.text === t.text);
          return match?.id ?? t.id;
        });
    }

    entries[key] = migrateEntry({ ...raw, completedTaskIds });
  }

  return entries;
}

function migrateSettings(settings: Partial<AppSettings>): AppSettings {
  const merged = { ...defaultSettings, ...settings };

  if (merged.currency === '$' || merged.currency === 'USD') {
    merged.currency = DEFAULT_CURRENCY;
    if (merged.dailyBudget <= 100) merged.dailyBudget = DEFAULT_DAILY_BUDGET;
  }

  if (!merged.monthlyBudget || merged.monthlyBudget < merged.dailyBudget) {
    merged.monthlyBudget = DEFAULT_MONTHLY_BUDGET;
  }

  if (merged.reminderHour === undefined) {
    merged.reminderHour = 8;
  }

  if (merged.reminderMinute === undefined) {
    merged.reminderMinute = 0;
  }

  return merged;
}

export function importDataJson(json: string): StoredData {
  const parsed = JSON.parse(json) as StoredData;
  if (!parsed.entries || typeof parsed.entries !== 'object') {
    throw new Error('Invalid backup file: missing entries');
  }
  const rawEntries = parsed.entries as Record<string, LegacyEntry>;
  const recurringTasks =
    parsed.recurringTasks && parsed.recurringTasks.length > 0
      ? parsed.recurringTasks
      : extractRecurringTasks(rawEntries);

  return {
    entries: migrateEntries(rawEntries, recurringTasks),
    recurringTasks,
    settings: migrateSettings(parsed.settings ?? {}),
  };
}

export function exportDataJson(data: StoredData): string {
  return JSON.stringify(data, null, 2);
}
