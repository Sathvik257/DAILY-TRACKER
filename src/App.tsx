import { AuthPage } from './components/AuthPage';
import { APP_NAME } from './constants/brand';
import { DailyAnalysis } from './components/DailyAnalysis';
import { DailyWellness } from './components/DailyWellness';
import { ExpenseTracker } from './components/ExpenseTracker';
import { Header } from './components/Header';
import { MonthCalendar } from './components/MonthCalendar';
import { NavBar } from './components/NavBar';
import { SafeSpend } from './components/SafeSpend';
import { SettingsPanel } from './components/SettingsPanel';
import { TaskList } from './components/TaskList';
import { WeekChart } from './components/WeekChart';
import { useAuth } from './context/AuthContext';
import { useDailyReminder } from './hooks/useDailyReminder';
import { useTracker } from './hooks/useTracker';
import { requestNotificationPermission } from './utils/reminders';
import './App.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const {
    selectedDate,
    setSelectedDate,
    view,
    setView,
    entry,
    tasks,
    settings,
    isToday,
    progress,
    expenseTotal,
    budget,
    analysis,
    streak,
    weekStats,
    monthCalendar,
    consistencyRate,
    saveStatus,
    hydrated,
    addTask,
    editTask,
    toggleTask,
    removeTask,
    addExpense,
    removeExpense,
    updateJournal,
    updateReflection,
    updateMood,
    updateSleep,
    updateWater,
    updateSettings,
    goToToday,
    exportBackup,
    importBackup,
    resetAll,
  } = useTracker(true);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;

  const { sendTestReminder } = useDailyReminder({
    userId: user?.id ?? '',
    enabled: settings.notificationsEnabled && !!user?.id,
    hour: settings.reminderHour,
    minute: settings.reminderMinute,
    userName: settings.userName,
    pendingCount,
  });

  const requestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      updateSettings({ notificationsEnabled: true });
    } else if ('Notification' in window && Notification.permission === 'denied') {
      alert('Notifications are blocked. Allow them in your browser settings for this site.');
    }
  };

  const handleCalendarSelect = (date: string) => {
    setSelectedDate(date);
    setView('today');
  };

  if (!hydrated) {
    return (
      <div className="app-loading">
        <span className="brand-mark">{APP_NAME}</span>
        <p>Loading your data…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="shell">
        <Header
          selectedDate={selectedDate}
          isToday={isToday}
          streak={streak}
          userName={settings.userName}
          userEmail={user?.email ?? ''}
          saveStatus={saveStatus}
          onDateChange={setSelectedDate}
          onGoToToday={goToToday}
          onLogout={logout}
        />

        <NavBar view={view} onViewChange={setView} />

        {view === 'today' && (
          <>
            <SafeSpend
              budget={budget}
              spentToday={expenseTotal}
              currency={settings.currency}
              progress={progress}
              tasksDone={completedCount}
              tasksTotal={tasks.length}
            />
            <div className="two-col">
              <div className="col">
                <TaskList
                  tasks={tasks}
                  onAdd={addTask}
                  onEdit={editTask}
                  onToggle={toggleTask}
                  onRemove={removeTask}
                />
                <ExpenseTracker
                  expenses={entry.expenses}
                  currency={settings.currency}
                  onAdd={addExpense}
                  onRemove={removeExpense}
                />
              </div>
              <div className="col">
                <DailyWellness
                  mood={entry.mood}
                  sleepHours={entry.sleepHours}
                  waterGlasses={entry.waterGlasses}
                  journal={entry.journal}
                  reflection={entry.reflection}
                  onMoodChange={updateMood}
                  onSleepChange={updateSleep}
                  onWaterChange={updateWater}
                  onJournalChange={updateJournal}
                  onReflectionChange={updateReflection}
                />
                <DailyAnalysis
                  analysis={analysis}
                  currency={settings.currency}
                  consistencyRate={consistencyRate}
                />
              </div>
            </div>
          </>
        )}

        {view === 'overview' && (
          <>
            <MonthCalendar days={monthCalendar} onSelectDate={handleCalendarSelect} />
            <WeekChart data={weekStats} currency={settings.currency} />
            <DailyAnalysis
              analysis={analysis}
              currency={settings.currency}
              consistencyRate={consistencyRate}
            />
          </>
        )}

        {view === 'settings' && (
          <SettingsPanel
            settings={settings}
            userId={user?.id ?? ''}
            onUpdate={updateSettings}
            onRequestNotification={requestNotification}
            onTestReminder={() => void sendTestReminder()}
            onExport={exportBackup}
            onImport={importBackup}
            onReset={resetAll}
          />
        )}
      </div>

      <footer className="footer">
        <p>Signed in as {user?.email}. Only you can see this data.</p>
      </footer>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <span className="brand-mark">{APP_NAME}</span>
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Dashboard key={user.id} />;
}

export default App;
