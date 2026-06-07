import { format, subDays } from 'date-fns';
import type { DailyEntry, ExpenseCategory, RecurringTask, Task } from '../types';
import { DEFAULT_CURRENCY, formatMoney } from './currency';
import { createEmptyEntry } from './storage';
import { getDayTasks } from './tasks';

const MOOD_LABELS = ['', 'Rough', 'Low', 'Okay', 'Good', 'Great'];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  transport: 'Travel',
  shopping: 'Shopping',
  bills: 'Bills',
  entertainment: 'Leisure',
  health: 'Health',
  other: 'Other',
};

export interface DailyInsight {
  summary: string;
  highlights: string[];
  suggestions: string[];
  taskScore: number;
  expenseTotal: number;
  topCategory: string | null;
  moodLabel: string;
}

export function analyzeDay(
  entry: DailyEntry,
  tasks: Task[],
  dailyBudget: number,
  recentEntries: { entry: DailyEntry; tasks: Task[] }[],
  currency = DEFAULT_CURRENCY
): DailyInsight {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const expenseTotal = entry.expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = entry.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry
    ? `${CATEGORY_LABELS[topCategoryEntry[0] as ExpenseCategory]} — ${formatMoney(topCategoryEntry[1], currency)}`
    : null;

  const highlights: string[] = [];
  const suggestions: string[] = [];

  if (totalTasks === 0) {
    suggestions.push('No tasks listed yet. Add two or three for today.');
  } else if (taskScore === 100) {
    highlights.push(`All ${totalTasks} tasks done.`);
  } else if (completedTasks > 0) {
    highlights.push(`${completedTasks} of ${totalTasks} tasks finished.`);
    if (totalTasks - completedTasks > 0) {
      suggestions.push(`${totalTasks - completedTasks} still open — pick the smallest one next.`);
    }
  } else {
    suggestions.push('Tasks are untouched. Start with one that takes under 10 minutes.');
  }

  if (expenseTotal === 0) {
    highlights.push('No spending logged.');
  } else if (expenseTotal <= dailyBudget) {
    highlights.push(`Spent ${formatMoney(expenseTotal, currency)} of ${formatMoney(dailyBudget, currency)} daily limit.`);
  } else {
    suggestions.push(`Over daily limit by ${formatMoney(expenseTotal - dailyBudget, currency)}.`);
  }

  if (entry.waterGlasses < 6) {
    suggestions.push(`Water: ${entry.waterGlasses} of 8 glasses.`);
  }

  if (entry.sleepHours < 6) {
    suggestions.push(`Sleep logged at ${entry.sleepHours}h — aim for 7+ tonight.`);
  }

  if (entry.mood <= 2) {
    suggestions.push('Mood is on the lower side. A short walk or break might help.');
  }

  const avgRecentSpend =
    recentEntries.length > 0
      ? recentEntries.reduce((s, r) => s + r.entry.expenses.reduce((a, x) => a + x.amount, 0), 0) /
        recentEntries.length
      : 0;

  if (avgRecentSpend > 0 && expenseTotal > avgRecentSpend * 1.25) {
    const pct = Math.round(((expenseTotal - avgRecentSpend) / avgRecentSpend) * 100);
    suggestions.push(`Spending is ${pct}% above your 7-day average.`);
  }

  if (entry.reflection.trim()) {
    highlights.push('End-of-day reflection recorded.');
  }

  const summary = buildSummary(tasks, entry, taskScore, expenseTotal, dailyBudget, currency);

  return {
    summary,
    highlights,
    suggestions,
    taskScore,
    expenseTotal,
    topCategory,
    moodLabel: MOOD_LABELS[entry.mood] ?? 'Okay',
  };
}

function buildSummary(
  tasks: Task[],
  entry: DailyEntry,
  taskScore: number,
  expenseTotal: number,
  dailyBudget: number,
  currency: string
): string {
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const mood = MOOD_LABELS[entry.mood] ?? 'Okay';

  const parts: string[] = [];

  parts.push(`Feeling ${mood.toLowerCase()}.`);

  if (total === 0) {
    parts.push('No tasks for this day.');
  } else if (taskScore === 100) {
    parts.push(`${total} tasks, all done.`);
  } else {
    parts.push(`${completed}/${total} tasks (${taskScore}%).`);
  }

  if (expenseTotal > dailyBudget) {
    parts.push(`${formatMoney(expenseTotal - dailyBudget, currency)} over budget.`);
  } else if (expenseTotal > 0) {
    parts.push(`${formatMoney(dailyBudget - expenseTotal, currency)} under budget.`);
  }

  return parts.join(' ');
}

export function getRecentEntries(
  entries: Record<string, DailyEntry>,
  recurringTasks: RecurringTask[],
  currentDate: string,
  days: number
): { entry: DailyEntry; tasks: Task[] }[] {
  const result: { entry: DailyEntry; tasks: Task[] }[] = [];
  for (let i = 1; i <= days; i++) {
    const d = format(subDays(new Date(currentDate), i), 'yyyy-MM-dd');
    if (entries[d]) {
      const entry = entries[d];
      result.push({ entry, tasks: getDayTasks(recurringTasks, entry) });
    }
  }
  return result;
}

export function getMonthCalendarData(
  entries: Record<string, DailyEntry>,
  recurringTasks: RecurringTask[],
  year: number,
  month: number
): { date: string; day: number; status: 'empty' | 'partial' | 'done' | 'missed' | 'future' }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const totalTasks = recurringTasks.length;
  const result = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = format(new Date(year, month, d), 'yyyy-MM-dd');
    const isFuture = dateKey > today;

    let status: 'empty' | 'partial' | 'done' | 'missed' | 'future' = 'empty';

    if (isFuture) {
      status = 'future';
    } else if (totalTasks > 0) {
      const entry = entries[dateKey] ?? createEmptyEntry(dateKey);
      const tasks = getDayTasks(recurringTasks, entry);
      const allDone = tasks.every((t) => t.completed);
      const someDone = tasks.some((t) => t.completed);
      status = allDone ? 'done' : someDone ? 'partial' : dateKey < today ? 'missed' : 'empty';
    } else if (dateKey < today) {
      status = 'empty';
    }

    result.push({ date: dateKey, day: d, status });
  }

  return result;
}

export { CATEGORY_LABELS, MOOD_LABELS };
