import type { BudgetSnapshot } from '../utils/budget';
import { formatMoney } from '../utils/currency';

interface SafeSpendProps {
  budget: BudgetSnapshot;
  spentToday: number;
  currency: string;
  progress: number;
  tasksDone: number;
  tasksTotal: number;
}

export function SafeSpend({
  budget,
  spentToday,
  currency,
  progress,
  tasksDone,
  tasksTotal,
}: SafeSpendProps) {
  const statusClass = budget.isOverDaily
    ? 'over'
    : budget.safeToSpend < budget.dailyRemaining * 0.2 && spentToday > 0
      ? 'tight'
      : 'ok';

  return (
    <section className="safe-spend">
      <div className="safe-spend-top">
        <div>
          <p className="label">Safe to spend today</p>
          <p className={`hero-amount ${statusClass}`}>{formatMoney(budget.safeToSpend, currency)}</p>
          <p className="insight-line">{budget.insight}</p>
        </div>
        <div className="task-ring" style={{ '--p': progress } as React.CSSProperties}>
          <svg viewBox="0 0 36 36">
            <path
              className="ring-track"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="ring-progress"
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="ring-text">
            {tasksDone}/{tasksTotal || '—'}
          </span>
        </div>
      </div>

      <div className="budget-row">
        <div className="budget-cell">
          <span className="cell-label">Spent today</span>
          <span className="cell-value">{formatMoney(spentToday, currency)}</span>
        </div>
        <div className="budget-cell">
          <span className="cell-label">Month left</span>
          <span className={`cell-value ${budget.isOverMonthly ? 'warn' : ''}`}>
            {formatMoney(budget.monthlyRemaining, currency)}
          </span>
        </div>
        <div className="budget-cell">
          <span className="cell-label">Pace / day</span>
          <span className="cell-value">{formatMoney(Math.max(0, Math.floor(budget.monthlyPacePerDay)), currency)}</span>
        </div>
      </div>

      <div className="spend-bar">
        <div
          className={`spend-fill ${statusClass}`}
          style={{
            width: `${Math.min((spentToday / (spentToday + budget.safeToSpend || 1)) * 100, 100)}%`,
          }}
        />
      </div>
    </section>
  );
}
