import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';

interface HeaderProps {
  selectedDate: string;
  isToday: boolean;
  streak: number;
  userName: string;
  userEmail: string;
  saveStatus: 'saved' | 'saving' | 'loading';
  onDateChange: (date: string) => void;
  onGoToToday: () => void;
  onLogout: () => void;
}

export function Header({
  selectedDate,
  isToday,
  streak,
  userName,
  userEmail,
  saveStatus,
  onDateChange,
  onGoToToday,
  onLogout,
}: HeaderProps) {
  const date = parseISO(selectedDate);
  const displayDate = format(date, 'EEEE, d MMMM');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const shift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    if (format(d, 'yyyy-MM-dd') > todayStr) return;
    onDateChange(format(d, 'yyyy-MM-dd'));
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const syncLabel =
    saveStatus === 'saved' ? 'Synced' : saveStatus === 'saving' ? 'Saving…' : 'Loading…';

  return (
    <header className="header">
      <div className="header-main">
        <div className="brand">
          <span className="brand-mark">{APP_NAME}</span>
          <span className="brand-sub">{APP_TAGLINE}</span>
        </div>
        <div className="header-meta">
          <span className={`sync-dot ${saveStatus}`} title={syncLabel} />
          {streak > 0 && <span className="streak-pill">{streak}d streak</span>}
          <button type="button" className="logout-btn" onClick={onLogout} title="Sign out">
            <LogOut size={15} />
            <span className="logout-email">{userEmail}</span>
          </button>
        </div>
      </div>

      <div className="header-greet">
        <h1>
          {greeting()}
          {userName ? `, ${userName}` : ''}
        </h1>
        <p className="header-date">{displayDate}</p>
      </div>

      <div className="date-nav">
        <button type="button" className="nav-arrow" onClick={() => shift(-1)} aria-label="Previous day">
          <ChevronLeft size={18} />
        </button>
        <label className="date-picker-wrap">
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            aria-label="Pick date"
          />
          <span>{isToday ? 'Today' : format(date, 'd MMM yyyy')}</span>
        </label>
        <button
          type="button"
          className="nav-arrow"
          onClick={() => shift(1)}
          disabled={isToday}
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>
        {!isToday && (
          <button type="button" className="link-btn" onClick={onGoToToday}>
            Back to today
          </button>
        )}
      </div>
    </header>
  );
}
