import { endOfMonth, parseISO } from 'date-fns';
import type { DailyEntry } from '../types';
import { formatMoney } from './currency';

export interface BudgetSnapshot {
  safeToSpend: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  monthlyPacePerDay: number;
  daysLeftInMonth: number;
  isOverDaily: boolean;
  isOverMonthly: boolean;
  insight: string;
}

export function computeBudget(
  entries: Record<string, DailyEntry>,
  selectedDate: string,
  dailyBudget: number,
  monthlyBudget: number,
  currency: string
): BudgetSnapshot {
  const entry = entries[selectedDate];
  const spentToday = entry?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0;

  const dailyRemaining = dailyBudget - spentToday;
  const safeToSpend = Math.max(0, dailyRemaining);

  const date = parseISO(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();

  const monthSpent = Object.entries(entries).reduce((sum, [key, day]) => {
    const d = parseISO(key);
    if (d.getFullYear() === year && d.getMonth() === month) {
      return sum + day.expenses.reduce((s, e) => s + e.amount, 0);
    }
    return sum;
  }, 0);

  const monthlyRemaining = monthlyBudget - monthSpent;
  const daysLeftInMonth = endOfMonth(date).getDate() - date.getDate() + 1;
  const monthlyPacePerDay = daysLeftInMonth > 0 ? monthlyRemaining / daysLeftInMonth : 0;

  const isOverDaily = spentToday > dailyBudget;
  const isOverMonthly = monthSpent > monthlyBudget;

  const insight = buildInsight({
    safeToSpend,
    spentToday,
    dailyBudget,
    monthlyRemaining,
    monthlyPacePerDay,
    isOverDaily,
    isOverMonthly,
    currency,
  });

  return {
    safeToSpend,
    dailyRemaining,
    monthlyRemaining,
    monthlyPacePerDay,
    daysLeftInMonth,
    isOverDaily,
    isOverMonthly,
    insight,
  };
}

function buildInsight(opts: {
  safeToSpend: number;
  spentToday: number;
  dailyBudget: number;
  monthlyRemaining: number;
  monthlyPacePerDay: number;
  isOverDaily: boolean;
  isOverMonthly: boolean;
  currency: string;
}): string {
  const {
    safeToSpend,
    spentToday,
    dailyBudget,
    monthlyRemaining,
    monthlyPacePerDay,
    isOverDaily,
    isOverMonthly,
    currency,
  } = opts;

  if (isOverMonthly) {
    return `Monthly cap exceeded by ${formatMoney(Math.abs(monthlyRemaining), currency)}.`;
  }
  if (isOverDaily) {
    return `${formatMoney(spentToday - dailyBudget, currency)} above today's limit.`;
  }
  if (spentToday === 0) {
    return `Daily limit is ${formatMoney(dailyBudget, currency)}.`;
  }
  if (monthlyPacePerDay > 0 && safeToSpend > monthlyPacePerDay * 1.5) {
    return `${formatMoney(safeToSpend, currency)} left today. Month pace is ${formatMoney(Math.floor(monthlyPacePerDay), currency)}/day.`;
  }
  if (safeToSpend > 0) {
    return `${formatMoney(safeToSpend, currency)} left for today.`;
  }
  return 'Daily budget used up.';
}
