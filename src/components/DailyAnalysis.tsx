import type { DailyInsight } from '../utils/analysis';
import { formatMoney } from '../utils/currency';

interface DailyAnalysisProps {
  analysis: DailyInsight;
  currency: string;
  consistencyRate: number;
}

export function DailyAnalysis({ analysis, currency, consistencyRate }: DailyAnalysisProps) {
  return (
    <section className="panel analysis">
      <div className="panel-head">
        <h2>Day summary</h2>
      </div>

      <p className="summary-text">{analysis.summary}</p>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-num">{analysis.taskScore}%</span>
          <span className="stat-lbl">Tasks</span>
        </div>
        <div className="stat">
          <span className="stat-num">{formatMoney(analysis.expenseTotal, currency)}</span>
          <span className="stat-lbl">Spent</span>
        </div>
        <div className="stat">
          <span className="stat-num">{analysis.moodLabel}</span>
          <span className="stat-lbl">Mood</span>
        </div>
        <div className="stat">
          <span className="stat-num">{consistencyRate}%</span>
          <span className="stat-lbl">Month</span>
        </div>
      </div>

      {analysis.topCategory && (
        <p className="top-cat">Most spent on {analysis.topCategory}</p>
      )}

      {analysis.highlights.length > 0 && (
        <div className="note-block">
          <h3>Noted</h3>
          <ul>
            {analysis.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions.length > 0 && (
        <div className="note-block muted">
          <h3>Worth a look</h3>
          <ul>
            {analysis.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
