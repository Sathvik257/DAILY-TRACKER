import type { AppView } from '../types';

interface NavBarProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
}

const TABS: { id: AppView; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'overview', label: 'Overview' },
  { id: 'settings', label: 'Settings' },
];

export function NavBar({ view, onViewChange }: NavBarProps) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-tab ${view === tab.id ? 'active' : ''}`}
          onClick={() => onViewChange(tab.id)}
          aria-current={view === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
