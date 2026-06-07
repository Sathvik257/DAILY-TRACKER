export interface RecurringTask {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'other';

export interface DailyEntry {
  date: string;
  completedTaskIds: string[];
  expenses: Expense[];
  journal: string;
  reflection: string;
  mood: number;
  sleepHours: number;
  waterGlasses: number;
}

export interface AppSettings {
  dailyBudget: number;
  monthlyBudget: number;
  currency: string;
  userName: string;
  displayName: string;
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export interface StoredData {
  entries: Record<string, DailyEntry>;
  recurringTasks: RecurringTask[];
  settings: AppSettings;
}

export type AppView = 'today' | 'overview' | 'settings';
