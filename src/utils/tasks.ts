import type { DailyEntry, RecurringTask, Task } from '../types';

export function getDayTasks(recurringTasks: RecurringTask[], entry: DailyEntry): Task[] {
  const completed = new Set(entry.completedTaskIds);
  return recurringTasks.map((rt) => ({
    id: rt.id,
    text: rt.text,
    completed: completed.has(rt.id),
    createdAt: rt.createdAt,
  }));
}

export function countCompleted(tasks: Task[]): number {
  return tasks.filter((t) => t.completed).length;
}

export function allTasksDone(tasks: Task[]): boolean {
  return tasks.length > 0 && tasks.every((t) => t.completed);
}
