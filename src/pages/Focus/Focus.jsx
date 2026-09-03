import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics';
import { Timer, Play, Pause, RotateCcw, Coffee } from 'lucide-react';

const PRESETS = [
  { label: 'Pomodoro', work: 25, break: 5, icon: '🍅' },
  { label: 'Deep Work', work: 50, break: 10, icon: '🧠' },
  { label: 'Short', work: 15, break: 3, icon: '⚡' },
];

const CATEGORIES = ['Study', 'Work', 'Creative', 'Reading', 'Exercise', 'Other'];

export default function Focus() {
  const { user } = useAuth();
  const [preset, setPreset] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].work * 60);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[0].work * 60);
  const [category, setCategory] = useState('Study');
  const [sessionStart, setSessionStart] = useState(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [customWork, setCustomWork] = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  const intervalRef = useRef(null);

  const { focusSessionsStore } = analyticsService;

  const todaysSessions = user
    ? focusSessionsStore.where(user.id, s => {
        const d = s.started_at?.split('T')[0];
        return d === new Date().toISOString().split('T')[0];
      })
    : [];

  const totalFocusToday = todaysSessions
    .filter(s => s.completed)
    .reduce((sum, s) => sum + (s.duration || 0), 0);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleTimerEnd = () => {
    setRunning(false);
    if (!isBreak && sessionStart) {
      // Save session
      const duration = PRESETS[preset]?.work || customWork;
      focusSessionsStore.create({
        user_id: user.id,
        started_at: sessionStart,
        ended_at: new Date().toISOString(),
        duration,
        category,
        completed: true,
      });
      analyticsService.addXP(user.id, 20, 'focus_session');
      setCompletedSessions(c => c + 1);
      setSessionStart(null);
    }
    // Switch to break or work
    const nextIsBreak = !isBreak;
    setIsBreak(nextIsBreak);
    const p = PRESETS[preset];
    const nextTime = (nextIsBreak ? (p?.break || 5) : (p?.work || customWork)) * 60;
    setSecondsLeft(nextTime);
    setTotalSeconds(nextTime);
  };

  const handleStart = () => {
    if (!running && !sessionStart && !isBreak) {
      setSessionStart(new Date().toISOString());
    }
    setRunning(r => !r);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setIsBreak(false);
    setSessionStart(null);
    const p = PRESETS[preset];
    const t = (p?.work || customWork) * 60;
    setSecondsLeft(t);
    setTotalSeconds(t);
  };

  const selectPreset = (i) => {
    setPreset(i);
    setShowCustom(i === -1);
    setRunning(false);
    setIsBreak(false);
    setSessionStart(null);
    const t = PRESETS[i].work * 60;
    setSecondsLeft(t);
    setTotalSeconds(t);
  };

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) : 1;

  const r = 100;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Focus Mode</h1>
        <p className="text-text-secondary text-sm mt-0.5">Deep work, one session at a time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold">{completedSessions}</p>
          <p className="text-xs text-text-muted">Sessions</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold">{Math.floor(totalFocusToday / 60)}h{totalFocusToday % 60}m</p>
          <p className="text-xs text-text-muted">Today</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold">{todaysSessions.filter(s => s.completed).length + completedSessions}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => selectPreset(i)}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
              preset === i ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-bg-elevated border-border text-text-secondary'
            }`}
          >
            <span>{p.icon} {p.label}</span>
            <span className="block text-text-muted font-normal mt-0.5">{p.work}/{p.break}m</span>
          </button>
        ))}
      </div>

      {/* Category */}
      <div>
        <label className="label">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                category === c ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-bg-elevated border-border text-text-secondary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="card flex flex-col items-center py-10 glow-accent">
        {isBreak && (
          <div className="flex items-center gap-1.5 text-success text-xs font-semibold mb-4 bg-success/10 px-3 py-1 rounded-full">
            <Coffee size={12} /> Break Time
          </div>
        )}

        <div className="relative" style={{ width: 240, height: 240 }}>
          <svg width="240" height="240" className="-rotate-90">
            <circle cx="120" cy="120" r={r} fill="none" stroke="#242830" strokeWidth="12" />
            <circle
              cx="120" cy="120" r={r} fill="none"
              stroke={isBreak ? '#22C55E' : 'url(#focusGrad)'}
              strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }}
            />
            <defs>
              <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold tabular-nums">{mins}:{secs}</div>
            <div className="text-text-muted text-sm mt-1">{category}</div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={handleReset} className="btn-secondary w-12 h-12 rounded-full p-0 justify-center">
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleStart}
            className={`w-16 h-16 rounded-full font-bold flex items-center justify-center transition-all shadow-lg ${
              running
                ? 'bg-bg-elevated border-2 border-border hover:border-border-light'
                : 'bg-gradient-to-br from-accent to-purple-600 text-white glow-accent'
            }`}
          >
            {running ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <div className="w-12 h-12" />
        </div>

        {running && (
          <p className="text-text-muted text-xs mt-4 animate-pulse">
            {isBreak ? 'Rest and recharge...' : 'Stay focused. You got this.'}
          </p>
        )}
      </div>
    </div>
  );
}
