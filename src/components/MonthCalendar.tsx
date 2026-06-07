import { format } from 'date-fns';

interface MonthCalendarProps {
  days: { date: string; day: number; status: 'empty' | 'partial' | 'done' | 'missed' | 'future' }[];
  onSelectDate: (date: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  done: 'All tasks done',
  partial: 'Partly done',
  missed: 'Tasks incomplete',
  empty: 'No tasks',
  future: '',
};

export function MonthCalendar({ days, onSelectDate }: MonthCalendarProps) {
  const monthLabel = format(new Date(), 'MMMM yyyy');
  const today = format(new Date(), 'yyyy-MM-dd');
  const firstDow = new Date(days[0]?.date ?? today).getDay();
  const blanks = Array.from({ length: firstDow }, (_, i) => i);

  return (
    <section className="panel calendar-panel">
      <div className="panel-head">
        <h2>{monthLabel}</h2>
        <div className="legend">
          <span><i className="dot done" /> Done</span>
          <span><i className="dot partial" /> Partial</span>
          <span><i className="dot missed" /> Missed</span>
        </div>
      </div>

      <div className="cal-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="cal-dow">{d}</span>
        ))}
        {blanks.map((b) => (
          <span key={`b-${b}`} className="cal-blank" />
        ))}
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            className={`cal-day ${d.status} ${d.date === today ? 'is-today' : ''}`}
            onClick={() => d.status !== 'future' && onSelectDate(d.date)}
            disabled={d.status === 'future'}
            title={STATUS_LABEL[d.status]}
          >
            {d.day}
          </button>
        ))}
      </div>
    </section>
  );
}
