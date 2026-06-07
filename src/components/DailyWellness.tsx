import { Droplets, Minus, Moon, Plus } from 'lucide-react';
import { MOOD_LABELS } from '../utils/analysis';

interface DailyWellnessProps {
  mood: number;
  sleepHours: number;
  waterGlasses: number;
  journal: string;
  reflection: string;
  onMoodChange: (mood: number) => void;
  onSleepChange: (hours: number) => void;
  onWaterChange: (glasses: number) => void;
  onJournalChange: (text: string) => void;
  onReflectionChange: (text: string) => void;
}

export function DailyWellness({
  mood,
  sleepHours,
  waterGlasses,
  journal,
  reflection,
  onMoodChange,
  onSleepChange,
  onWaterChange,
  onJournalChange,
  onReflectionChange,
}: DailyWellnessProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Check-in</h2>
      </div>

      <div className="wellness-row">
        <div className="wellness-block">
          <span className="field-label">Mood</span>
          <div className="mood-row">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                type="button"
                className={`mood-opt ${mood === m ? 'sel' : ''}`}
                onClick={() => onMoodChange(m)}
                title={MOOD_LABELS[m]}
              >
                {['😞', '😕', '😐', '🙂', '😊'][m - 1]}
              </button>
            ))}
          </div>
          <span className="field-hint">{MOOD_LABELS[mood]}</span>
        </div>

        <div className="wellness-block">
          <span className="field-label"><Moon size={13} /> Sleep</span>
          <div className="stepper">
            <button type="button" onClick={() => onSleepChange(Math.max(0, sleepHours - 0.5))}><Minus size={14} /></button>
            <span>{sleepHours}h</span>
            <button type="button" onClick={() => onSleepChange(Math.min(12, sleepHours + 0.5))}><Plus size={14} /></button>
          </div>
        </div>

        <div className="wellness-block">
          <span className="field-label"><Droplets size={13} /> Water</span>
          <div className="stepper">
            <button type="button" onClick={() => onWaterChange(Math.max(0, waterGlasses - 1))}><Minus size={14} /></button>
            <span>{waterGlasses}/8</span>
            <button type="button" onClick={() => onWaterChange(Math.min(12, waterGlasses + 1))}><Plus size={14} /></button>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="reflection">What nearly got in the way today?</label>
        <textarea
          id="reflection"
          rows={2}
          placeholder="Traffic, meetings, low energy…"
          value={reflection}
          onChange={(e) => onReflectionChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="journal">Notes</label>
        <textarea
          id="journal"
          rows={3}
          placeholder="Anything worth remembering about today."
          value={journal}
          onChange={(e) => onJournalChange(e.target.value)}
        />
      </div>
    </section>
  );
}
