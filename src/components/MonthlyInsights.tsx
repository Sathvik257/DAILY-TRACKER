import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Smile, 
  Moon, 
  Droplet, 
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { AppSettings, DailyEntry, ExpenseCategory, RecurringTask } from '../types';
import { CATEGORY_LABELS } from '../utils/analysis';
import { formatMoney } from '../utils/currency';
import { getDayTasks } from '../utils/tasks';

interface MonthlyInsightsProps {
  entries: Record<string, DailyEntry>;
  recurringTasks: RecurringTask[];
  settings: AppSettings;
}

const CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other',
];

export function MonthlyInsights({ entries, recurringTasks, settings }: MonthlyInsightsProps) {
  const currency = settings.currency;
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  // Find all unique months in entries to populate the dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr);
    
    // Check all dates in entries
    Object.keys(entries).forEach((dateKey) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        months.add(dateKey.slice(0, 7));
      }
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [entries, currentMonthStr]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [isMTD, setIsMTD] = useState(true);

  const isCurrentMonthSelected = selectedMonth === currentMonthStr;

  // Calculate previous month string
  const prevMonthStr = useMemo(() => {
    // selectedMonth format: "yyyy-MM", e.g., "2026-06"
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed in JS Dates
    const date = new Date(year, month - 1, 15); // Use middle of month to avoid timezone shifts
    return format(date, 'yyyy-MM');
  }, [selectedMonth]);

  const selectedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    return format(new Date(parseInt(year, 10), parseInt(month, 10) - 1, 15), 'MMMM yyyy');
  }, [selectedMonth]);

  const prevMonthLabel = useMemo(() => {
    const [year, month] = prevMonthStr.split('-');
    return format(new Date(parseInt(year, 10), parseInt(month, 10) - 1, 15), 'MMMM yyyy');
  }, [prevMonthStr]);

  // Determine current day of month for MTD comparison
  const todayDay = new Date().getDate();

  // Filter entries for selected month and previous month
  const currentMonthEntries = useMemo(() => {
    return Object.entries(entries).filter(([dateKey]) => {
      if (!dateKey.startsWith(selectedMonth)) return false;
      if (isMTD && isCurrentMonthSelected) {
        const day = parseInt(dateKey.slice(8, 10), 10);
        return day <= todayDay;
      }
      return true;
    });
  }, [entries, selectedMonth, isMTD, isCurrentMonthSelected, todayDay]);

  const prevMonthEntries = useMemo(() => {
    return Object.entries(entries).filter(([dateKey]) => {
      if (!dateKey.startsWith(prevMonthStr)) return false;
      if (isMTD && isCurrentMonthSelected) {
        const day = parseInt(dateKey.slice(8, 10), 10);
        return day <= todayDay;
      }
      return true;
    });
  }, [entries, prevMonthStr, isMTD, isCurrentMonthSelected, todayDay]);

  // Calculations for Selected Month
  const currentTotalSpend = useMemo(() => {
    return currentMonthEntries.reduce((sum, [, day]) => {
      return sum + day.expenses.reduce((s, e) => s + e.amount, 0);
    }, 0);
  }, [currentMonthEntries]);

  // Calculations for Previous Month
  const prevTotalSpend = useMemo(() => {
    return prevMonthEntries.reduce((sum, [, day]) => {
      return sum + day.expenses.reduce((s, e) => s + e.amount, 0);
    }, 0);
  }, [prevMonthEntries]);

  // Month-over-Month difference
  const momDiff = currentTotalSpend - prevTotalSpend;
  const momPercent = prevTotalSpend > 0 ? (momDiff / prevTotalSpend) * 100 : 0;

  // Category Spends
  const currentCategorySpends = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      food: 0, transport: 0, shopping: 0, bills: 0, entertainment: 0, health: 0, other: 0,
    };
    currentMonthEntries.forEach(([, day]) => {
      day.expenses.forEach((e) => {
        if (totals[e.category] !== undefined) {
          totals[e.category] += e.amount;
        }
      });
    });
    return totals;
  }, [currentMonthEntries]);

  const prevCategorySpends = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      food: 0, transport: 0, shopping: 0, bills: 0, entertainment: 0, health: 0, other: 0,
    };
    prevMonthEntries.forEach(([, day]) => {
      day.expenses.forEach((e) => {
        if (totals[e.category] !== undefined) {
          totals[e.category] += e.amount;
        }
      });
    });
    return totals;
  }, [prevMonthEntries]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: CATEGORY_LABELS[cat],
      [selectedMonthLabel]: currentCategorySpends[cat],
      [prevMonthLabel]: prevCategorySpends[cat],
    }));
  }, [currentCategorySpends, prevCategorySpends, selectedMonthLabel, prevMonthLabel]);

  // Daily Averages
  const daysInCurrentPeriod = currentMonthEntries.length || 1;
  const daysInPrevPeriod = prevMonthEntries.length || 1;
  const currentDailyAvgSpend = currentTotalSpend / daysInCurrentPeriod;
  const prevDailyAvgSpend = prevTotalSpend / daysInPrevPeriod;

  // Wellness & Task Rates
  const currentWellness = useMemo(() => {
    let moodSum = 0;
    let moodCount = 0;
    let sleepSum = 0;
    let sleepCount = 0;
    let waterSum = 0;
    let waterCount = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    currentMonthEntries.forEach(([, day]) => {
      if (day.mood > 0) {
        moodSum += day.mood;
        moodCount++;
      }
      if (day.sleepHours > 0) {
        sleepSum += day.sleepHours;
        sleepCount++;
      }
      waterSum += day.waterGlasses;
      waterCount++;

      const dayTasks = getDayTasks(recurringTasks, day);
      totalTasks += dayTasks.length;
      completedTasks += dayTasks.filter((t) => t.completed).length;
    });

    return {
      avgMood: moodCount > 0 ? moodSum / moodCount : 0,
      avgSleep: sleepCount > 0 ? sleepSum / sleepCount : 0,
      avgWater: waterCount > 0 ? waterSum / waterCount : 0,
      taskConsistency: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }, [currentMonthEntries, recurringTasks]);

  const prevWellness = useMemo(() => {
    let moodSum = 0;
    let moodCount = 0;
    let sleepSum = 0;
    let sleepCount = 0;
    let waterSum = 0;
    let waterCount = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    prevMonthEntries.forEach(([, day]) => {
      if (day.mood > 0) {
        moodSum += day.mood;
        moodCount++;
      }
      if (day.sleepHours > 0) {
        sleepSum += day.sleepHours;
        sleepCount++;
      }
      waterSum += day.waterGlasses;
      waterCount++;

      const dayTasks = getDayTasks(recurringTasks, day);
      totalTasks += dayTasks.length;
      completedTasks += dayTasks.filter((t) => t.completed).length;
    });

    return {
      avgMood: moodCount > 0 ? moodSum / moodCount : 0,
      avgSleep: sleepCount > 0 ? sleepSum / sleepCount : 0,
      avgWater: waterCount > 0 ? waterSum / waterCount : 0,
      taskConsistency: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }, [prevMonthEntries, recurringTasks]);

  // Automated Smart Insights
  const smartInsights = useMemo(() => {
    const insights: string[] = [];

    // Overall spending insight
    if (currentTotalSpend > 0 && prevTotalSpend > 0) {
      const pct = Math.abs(momPercent).toFixed(1);
      if (momDiff < 0) {
        insights.push(`🎉 Fantastic! You spent ${formatMoney(Math.abs(momDiff), currency)} (${pct}%) less than last month.`);
      } else {
        insights.push(`⚠️ Your spending is up by ${formatMoney(momDiff, currency)} (${pct}%) compared to last month.`);
      }
    }

    // Budget pace
    const monthlyBudget = settings.monthlyBudget;
    if (currentTotalSpend > monthlyBudget) {
      insights.push(`🚨 You have exceeded your monthly budget of ${formatMoney(monthlyBudget, currency)} by ${formatMoney(currentTotalSpend - monthlyBudget, currency)}.`);
    } else if (currentTotalSpend > monthlyBudget * 0.85) {
      insights.push(`⚠️ Heads up: You have used ${Math.round((currentTotalSpend / monthlyBudget) * 100)}% of your monthly budget.`);
    }

    // Category specific changes
    let biggestIncreaseCat: ExpenseCategory | null = null;
    let biggestIncreaseAmt = 0;
    let biggestDecreaseCat: ExpenseCategory | null = null;
    let biggestDecreaseAmt = 0;

    CATEGORIES.forEach((cat) => {
      const diff = currentCategorySpends[cat] - prevCategorySpends[cat];
      if (diff > biggestIncreaseAmt) {
        biggestIncreaseAmt = diff;
        biggestIncreaseCat = cat;
      }
      if (diff < biggestDecreaseAmt) {
        biggestDecreaseAmt = diff;
        biggestDecreaseCat = cat;
      }
    });

    if (biggestIncreaseCat && biggestIncreaseAmt > 50) {
      insights.push(`📈 Spending in ${CATEGORY_LABELS[biggestIncreaseCat]} increased the most, up by ${formatMoney(biggestIncreaseAmt, currency)}.`);
    }
    if (biggestDecreaseCat && Math.abs(biggestDecreaseAmt) > 50) {
      insights.push(`📉 Great saving in ${CATEGORY_LABELS[biggestDecreaseCat]}, down by ${formatMoney(Math.abs(biggestDecreaseAmt), currency)}!`);
    }

    // Task consistency wellness insight
    const taskDiff = currentWellness.taskConsistency - prevWellness.taskConsistency;
    if (taskDiff > 2) {
      insights.push(`🚀 Productivity boost! Task completion is up by ${taskDiff.toFixed(1)}% vs. last month.`);
    } else if (taskDiff < -5) {
      insights.push(`💤 Focus check: Task consistency dropped by ${Math.abs(taskDiff).toFixed(1)}%. Consider simplifying your daily checklists.`);
    }

    // Water or sleep insight
    if (currentWellness.avgWater < 5) {
      insights.push('💧 Drink up: Your water intake averages less than 5 glasses/day. Aim for 8 glasses to stay hydrated.');
    }

    if (insights.length === 0) {
      insights.push('Log more spending and tasks to unlock personalized, actionable financial insights.');
    }

    return insights;
  }, [currentTotalSpend, prevTotalSpend, momDiff, momPercent, currentCategorySpends, prevCategorySpends, currentWellness, prevWellness, settings.monthlyBudget, currency]);

  // Recharts styling
  const tipStyle = {
    background: '#fff',
    border: '1px solid #E5DFD6',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#2C2825',
  };

  const budgetProgressPercent = Math.min(100, Math.round((currentTotalSpend / settings.monthlyBudget) * 100));

  return (
    <section className="panel monthly-insights-panel">
      {/* 1. Header & Month Select */}
      <div className="panel-head monthly-header-row">
        <div>
          <h2>Monthly Trends & Comparison</h2>
          <p className="panel-hint" style={{ margin: '0.1rem 0 0' }}>
            Analyze your spending velocity and habits month-over-month.
          </p>
        </div>
        <div className="month-select-wrap">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-dropdown"
          >
            {availableMonths.map((m) => {
              const [yearStr, monthStr] = m.split('-');
              const label = format(new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 15), 'MMMM yyyy');
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 2. Month-to-Date Toggle (If current calendar month is selected) */}
      {isCurrentMonthSelected && (
        <div className="mtd-banner">
          <div className="mtd-info">
            <Info size={15} className="mtd-icon-info" />
            <div>
              <strong>Month-to-Date (MTD) Comparison active</strong>
              <p>Comparing {selectedMonthLabel} (days 1–{todayDay}) against {prevMonthLabel} (days 1–{todayDay}) for a balanced analysis.</p>
            </div>
          </div>
          <button 
            type="button" 
            className={`switch ${isMTD ? 'on' : ''}`}
            onClick={() => setIsMTD(!isMTD)}
            title="Toggle MTD or Full Month comparison"
          >
            <span />
          </button>
        </div>
      )}

      {/* 3. Core Statistics Cards Grid */}
      <div className="mom-stats-grid">
        {/* Spent Card */}
        <div className="mom-stat-card">
          <span className="mom-card-label font-serif" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Spent in {selectedMonthLabel}</span>
          <span className="mom-card-value font-serif" style={{ display: 'block', fontSize: '1.5rem', fontWeight: 600, color: 'var(--green)', margin: '0.2rem 0' }}>{formatMoney(currentTotalSpend, currency)}</span>
          <div className="mom-card-budget">
            <div className="spend-bar" style={{ height: '5px', margin: '0.4rem 0 0.2rem' }}>
              <div 
                className={`spend-fill ${budgetProgressPercent > 90 ? 'over' : budgetProgressPercent > 70 ? 'tight' : ''}`}
                style={{ width: `${budgetProgressPercent}%` }}
              />
            </div>
            <div className="mom-budget-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-faint)' }}>
              <span>{budgetProgressPercent}% of monthly limit</span>
              <span>Limit: {formatMoney(settings.monthlyBudget, currency)}</span>
            </div>
          </div>
        </div>

        {/* Variance Card */}
        <div className="mom-stat-card">
          <span className="mom-card-label font-serif" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-faint)' }}>VS. {prevMonthLabel}</span>
          <span className="mom-card-value font-serif" style={{ display: 'block', fontSize: '1.5rem', fontWeight: 600, margin: '0.2rem 0' }}>
            {formatMoney(Math.abs(momDiff), currency)}
          </span>
          <div className="mom-variance-row" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem' }}>
            {momDiff > 0 ? (
              <span className="mom-badge increase" style={{ color: 'var(--danger)', background: '#F9ECEC', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={12} />
                +{momPercent.toFixed(1)}%
              </span>
            ) : momDiff < 0 ? (
              <span className="mom-badge decrease" style={{ color: 'var(--green)', background: 'var(--green-light)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowDownRight size={12} />
                {momPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="mom-badge neutral" style={{ color: 'var(--text-muted)', background: 'var(--bg-warm)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                No change
              </span>
            )}
            <span className="mom-variance-lbl" style={{ color: 'var(--text-faint)' }}>{momDiff > 0 ? 'higher' : 'lower'} spend</span>
          </div>
        </div>

        {/* Daily Average Card */}
        <div className="mom-stat-card">
          <span className="mom-card-label font-serif" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Daily Avg. Spending</span>
          <span className="mom-card-value font-serif" style={{ display: 'block', fontSize: '1.5rem', fontWeight: 600, margin: '0.2rem 0' }}>{formatMoney(currentDailyAvgSpend, currency)}</span>
          <div className="mom-sub-stat" style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>
            <span>vs. {formatMoney(prevDailyAvgSpend, currency)}/day last month</span>
          </div>
        </div>

        {/* Task Completion Consistency Card */}
        <div className="mom-stat-card">
          <span className="mom-card-label font-serif" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Task Consistency</span>
          <span className="mom-card-value font-serif" style={{ display: 'block', fontSize: '1.5rem', fontWeight: 600, margin: '0.2rem 0' }}>{Math.round(currentWellness.taskConsistency)}%</span>
          <div className="mom-sub-stat" style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>
            <span>vs. {Math.round(prevWellness.taskConsistency)}% last month</span>
          </div>
        </div>
      </div>

      {/* 4. Visual Charts and Detailed Category List */}
      <div className="mom-breakdown-row">
        {/* Recharts Bar Chart */}
        <div className="mom-chart-container">
          <p className="chart-label">Spending Comparison by Category</p>
          {currentTotalSpend === 0 && prevTotalSpend === 0 ? (
            <div className="mom-chart-empty">
              <HelpCircle size={32} />
              <p>No spending logged in either month to display comparison chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E1" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: '#7A7268', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7A7268', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(v) => [formatMoney(Number(v), currency), 'Spent']} 
                  contentStyle={tipStyle} 
                />
                <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={selectedMonthLabel} fill="#2D5A4A" radius={[3, 3, 0, 0]} />
                <Bar dataKey={prevMonthLabel} fill="#B85C38" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown text list */}
        <div className="mom-category-list">
          <p className="chart-label">Category Details & Change</p>
          <div className="mom-cat-scroll">
            {CATEGORIES.map((cat) => {
              const currentAmt = currentCategorySpends[cat];
              const prevAmt = prevCategorySpends[cat];
              const diff = currentAmt - prevAmt;
              const percent = prevAmt > 0 ? (diff / prevAmt) * 100 : 0;
              const pctOfTotal = currentTotalSpend > 0 ? (currentAmt / currentTotalSpend) * 100 : 0;

              return (
                <div key={cat} className="mom-cat-item">
                  <div className="mom-cat-item-left">
                    <span className={`exp-dot c-${cat}`} />
                    <div className="mom-cat-info">
                      <span className="mom-cat-name">{CATEGORY_LABELS[cat]}</span>
                      <span className="mom-cat-pct">{pctOfTotal.toFixed(0)}% of total</span>
                    </div>
                  </div>
                  
                  <div className="mom-cat-item-right">
                    <span className="mom-cat-amt">{formatMoney(currentAmt, currency)}</span>
                    <span className={`mom-cat-change ${diff > 0 ? 'increase' : diff < 0 ? 'decrease' : ''}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      {diff > 0 ? (
                        `+${percent.toFixed(0)}%`
                      ) : diff < 0 ? (
                        `${percent.toFixed(0)}%`
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Wellness Habits Comparison Section */}
      <div className="mom-wellness-section">
        <h3 className="section-subtitle">Wellness & Productivity MoM</h3>
        <div className="mom-wellness-grid">
          {/* Mood Compare */}
          <div className="mom-wellness-card">
            <div className="mom-wellness-header">
              <Smile size={18} className="w-icon mood" />
              <span>Mood Rating</span>
            </div>
            <div className="mom-wellness-values">
              <span className="current-val">{currentWellness.avgMood > 0 ? `${currentWellness.avgMood.toFixed(1)}/5` : '—'}</span>
              <span className="prev-val">vs. {prevWellness.avgMood > 0 ? `${prevWellness.avgMood.toFixed(1)}/5` : '—'} last month</span>
            </div>
          </div>

          {/* Sleep Compare */}
          <div className="mom-wellness-card">
            <div className="mom-wellness-header">
              <Moon size={18} className="w-icon sleep" />
              <span>Avg Sleep</span>
            </div>
            <div className="mom-wellness-values">
              <span className="current-val">{currentWellness.avgSleep > 0 ? `${currentWellness.avgSleep.toFixed(1)}h` : '—'}</span>
              <span className="prev-val">vs. {prevWellness.avgSleep > 0 ? `${prevWellness.avgSleep.toFixed(1)}h` : '—'} last month</span>
            </div>
          </div>

          {/* Water Compare */}
          <div className="mom-wellness-card">
            <div className="mom-wellness-header">
              <Droplet size={18} className="w-icon water" />
              <span>Water Intake</span>
            </div>
            <div className="mom-wellness-values">
              <span className="current-val">{currentWellness.avgWater > 0 ? `${currentWellness.avgWater.toFixed(1)} gl` : '—'}</span>
              <span className="prev-val">vs. {prevWellness.avgWater > 0 ? `${prevWellness.avgWater.toFixed(1)} gl` : '—'} last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Smart Suggestions Box */}
      <div className="mom-insights-box">
        <div className="mom-insights-box-title">
          <Sparkles size={16} />
          <span>Smart Trends & Budget Insights</span>
        </div>
        <ul className="mom-insights-list">
          {smartInsights.map((insight, idx) => (
            <li key={idx} className="mom-insight-bullet">
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
