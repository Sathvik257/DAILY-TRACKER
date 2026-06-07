import { useRef, useState } from 'react';
import { Bell, Download, Trash2, Upload } from 'lucide-react';
import type { AppSettings } from '../types';
import { APP_NAME, APP_STORAGE_PREFIX } from '../constants/brand';
import { DEFAULT_CURRENCY, DEFAULT_DAILY_BUDGET, DEFAULT_MONTHLY_BUDGET } from '../utils/currency';
import { hasReminderFiredToday } from '../utils/reminders';

interface SettingsPanelProps {
  settings: AppSettings;
  userId: string;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onRequestNotification: () => void;
  onTestReminder: () => void;
  onExport: () => string;
  onImport: (json: string) => void;
  onReset: () => void | Promise<void>;
}

function formatTimeValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseTimeValue(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

function permissionLabel(): string {
  if (!('Notification' in window)) return 'Not supported in this browser';
  if (Notification.permission === 'granted') return 'Allowed';
  if (Notification.permission === 'denied') return 'Blocked — enable in browser settings';
  return 'Not allowed yet';
}

export function SettingsPanel({
  settings,
  userId,
  onUpdate,
  onRequestNotification,
  onTestReminder,
  onExport,
  onImport,
  onReset,
}: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${APP_STORAGE_PREFIX}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Backup saved to downloads.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImport(reader.result as string);
        setMsg('Data restored.');
      } catch {
        setMsg('Could not read that file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('Delete everything? This cannot be undone.')) {
      await onReset();
      setMsg('All data cleared.');
    }
  };

  const handleTimeChange = (value: string) => {
    const { hour, minute } = parseTimeValue(value);
    onUpdate({ reminderHour: hour, reminderMinute: minute });
  };

  const handleToggle = () => {
    if (settings.notificationsEnabled) {
      onUpdate({ notificationsEnabled: false });
      setMsg('Daily reminders turned off.');
    } else {
      onRequestNotification();
      setMsg('Reminders enabled — you will get one notification each day at your chosen time.');
    }
  };

  const handleTest = () => {
    if (Notification.permission !== 'granted') {
      setMsg('Allow notifications first.');
      return;
    }
    onTestReminder();
    setMsg('Test notification sent.');
  };

  const sentToday = userId && hasReminderFiredToday(userId);

  return (
    <section className="panel settings">
      <div className="panel-head">
        <h2>Preferences</h2>
      </div>

      <div className="settings-form">
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            placeholder="Name shown on your dashboard"
            value={settings.displayName}
            onChange={(e) => onUpdate({ displayName: e.target.value })}
          />
          <span className="field-hint">This is the name you see in the greeting — choose anything you like.</span>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="dailyBudget">Daily limit (₹)</label>
            <div className="money-field">
              <span>{settings.currency}</span>
              <input
                id="dailyBudget"
                type="number"
                min="1"
                step="50"
                value={settings.dailyBudget}
                onChange={(e) => onUpdate({ dailyBudget: parseFloat(e.target.value) || DEFAULT_DAILY_BUDGET })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="monthlyBudget">Monthly cap (₹)</label>
            <div className="money-field">
              <span>{settings.currency}</span>
              <input
                id="monthlyBudget"
                type="number"
                min="100"
                step="500"
                value={settings.monthlyBudget}
                onChange={(e) => onUpdate({ monthlyBudget: parseFloat(e.target.value) || DEFAULT_MONTHLY_BUDGET })}
              />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="currency">Symbol</label>
            <input
              id="currency"
              type="text"
              maxLength={4}
              value={settings.currency}
              onChange={(e) => onUpdate({ currency: e.target.value || DEFAULT_CURRENCY })}
            />
          </div>
          <div className="field">
            <label htmlFor="reminderTime">Daily reminder time</label>
            <input
              id="reminderTime"
              type="time"
              value={formatTimeValue(settings.reminderHour, settings.reminderMinute)}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={!settings.notificationsEnabled}
            />
          </div>
        </div>

        <div className="reminder-panel">
          <div className="toggle-line">
            <div>
              <span className="field-label">
                <Bell size={14} /> Daily reminder
              </span>
              <span className="field-hint">
                Browser notification + email from {APP_NAME} every day at{' '}
                {formatTimeValue(settings.reminderHour, settings.reminderMinute)}
              </span>
            </div>
            <button
              type="button"
              className={`switch ${settings.notificationsEnabled ? 'on' : ''}`}
              onClick={handleToggle}
              aria-pressed={settings.notificationsEnabled}
            >
              <span />
            </button>
          </div>

          <div className="reminder-status">
            <span>Browser permission: {permissionLabel()}</span>
            {settings.notificationsEnabled && sentToday && (
              <span className="reminder-sent">Today&apos;s reminder already sent</span>
            )}
          </div>

          {settings.notificationsEnabled && Notification.permission === 'granted' && (
            <button type="button" className="btn outline test-reminder-btn" onClick={handleTest}>
              Send test notification
            </button>
          )}
        </div>

        <div className="action-row">
          <button type="button" className="btn outline" onClick={handleExport}>
            <Download size={15} /> Export
          </button>
          <button type="button" className="btn outline" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Import
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
          <button type="button" className="btn danger-outline" onClick={handleReset}>
            <Trash2 size={15} /> Clear all
          </button>
        </div>

        {msg && <p className="settings-msg">{msg}</p>}
      </div>
    </section>
  );
}
