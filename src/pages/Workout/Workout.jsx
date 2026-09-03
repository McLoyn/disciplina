import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workoutService } from '../../services/workout';
import { analyticsService } from '../../services/analytics';
import { Dumbbell, Plus, X, Play, Square, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

function SessionStartModal({ plans, onClose, onStart }) {
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [title, setTitle] = useState('');
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Start Workout</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Session Title</label>
            <input className="input" placeholder="e.g. Upper Body A" value={title}
              onChange={e => setTitle(e.target.value)} />
          </div>
          {plans.length > 0 && (
            <div>
              <label className="label">Workout Plan (optional)</label>
              <select className="input" value={planId} onChange={e => setPlanId(e.target.value)}>
                <option value="">No plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => onStart(planId || null, title || 'Workout Session')} className="btn-primary flex-1 justify-center">
              <Play size={16} /> Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveSession({ session, exercises, onFinish }) {
  const [loggedSets, setLoggedSets] = useState({});
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session.started_at)) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="space-y-4">
      <div className="card border-success/20 bg-success/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">{session.title}</p>
            <div className="flex items-center gap-1.5 text-success text-sm mt-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>In Progress — {mins}:{secs.toString().padStart(2, '0')}</span>
            </div>
          </div>
          <button onClick={() => onFinish(session.id, notes)} className="btn-primary bg-success hover:bg-green-600">
            <Square size={16} /> Finish
          </button>
        </div>
      </div>
      <div>
        <label className="label">Session Notes</label>
        <textarea className="input resize-none h-16" placeholder="How did the workout feel?"
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <p className="text-text-muted text-sm text-center">Complete your exercises and tap Finish when done.</p>
    </div>
  );
}

export default function Workout() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [tab, setTab] = useState('history');

  const plans = workoutService.getPlans(user.id);
  const exercises = workoutService.getExercises(user.id);
  const sessions = workoutService.getSessions(user.id);
  const weeklyStats = workoutService.getWeeklyStats(user.id);

  const handleStart = (planId, title) => {
    const session = workoutService.startSession(user.id, planId, title);
    setActiveSession(session);
    setShowStartModal(false);
  };

  const handleFinish = (sessionId, notes) => {
    workoutService.finishSession(sessionId, notes);
    analyticsService.addXP(user.id, 20, 'workout_session', sessionId);
    setActiveSession(null);
    setRefresh(r => r + 1);
  };

  // Create plan modal state
  const [planForm, setPlanForm] = useState({ name: '', description: '', frequency: '3x/week' });
  const handleCreatePlan = (e) => {
    e.preventDefault();
    workoutService.createPlan(user.id, planForm);
    setShowPlanModal(false);
    setPlanForm({ name: '', description: '', frequency: '3x/week' });
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workout</h1>
          <p className="text-text-secondary text-sm mt-0.5">Track your training consistency</p>
        </div>
        <button onClick={() => setShowStartModal(true)} className="btn-primary">
          <Play size={16} /> Start Session
        </button>
      </div>

      {/* Active session */}
      {activeSession && (
        <ActiveSession session={activeSession} exercises={exercises} onFinish={handleFinish} />
      )}

      {/* Weekly stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions', value: weeklyStats.sessions },
          { label: 'Total Time', value: `${Math.floor(weeklyStats.totalMinutes / 60)}h ${weeklyStats.totalMinutes % 60}m` },
          { label: 'Consistency', value: `${weeklyStats.consistency}%` },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        {['history', 'plans', 'exercises'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`${t === tab ? 'tab-active' : 'tab-inactive'} capitalize text-sm`}>
            {t}
          </button>
        ))}
      </div>

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="card text-center py-12">
              <Dumbbell size={32} className="text-accent-light mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No Sessions Yet</h3>
              <p className="text-text-secondary text-sm mb-4">Start your first workout!</p>
              <button onClick={() => setShowStartModal(true)} className="btn-primary mx-auto w-fit">
                <Play size={16} /> Start Now
              </button>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className="card-hover flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                s.status === 'Completed' ? 'bg-success/15' : 'bg-bg-hover'
              }`}>
                {s.status === 'Completed'
                  ? <CheckCircle2 size={18} className="text-success" />
                  : <Dumbbell size={18} className="text-text-muted" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{s.title}</p>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  <span>{format(new Date(s.started_at), 'MMM d')}</span>
                  {s.duration && <span><Clock size={10} className="inline mr-0.5" />{s.duration}m</span>}
                  <span className={`badge ${s.status === 'Completed' ? 'badge-success' : 'badge-muted'}`}>{s.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plans */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <button onClick={() => setShowPlanModal(true)} className="btn-secondary w-full justify-center">
            <Plus size={16} /> New Plan
          </button>
          {plans.length === 0 ? (
            <div className="card text-center py-8 text-text-muted">
              <p>No plans yet. Create a workout plan to track consistency.</p>
            </div>
          ) : plans.map(plan => (
            <div key={plan.id} className="card-hover">
              <p className="font-semibold">{plan.name}</p>
              {plan.description && <p className="text-text-muted text-sm mt-1">{plan.description}</p>}
              <span className="badge-muted badge mt-2">{plan.frequency}</span>
            </div>
          ))}
        </div>
      )}

      {/* Exercise library */}
      {tab === 'exercises' && (
        <div className="space-y-2">
          <p className="text-text-muted text-sm">Built-in exercise library</p>
          {exercises.map(ex => (
            <div key={ex.id} className="card-hover flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{ex.name}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="badge-muted badge">{ex.muscle_group}</span>
                  <span className="text-xs text-text-muted">{ex.equipment}</span>
                  <span className="text-xs text-text-muted">{ex.exercise_type}</span>
                </div>
              </div>
              {ex.is_custom && <span className="badge-accent badge">Custom</span>}
            </div>
          ))}
        </div>
      )}

      {showStartModal && (
        <SessionStartModal plans={plans} onClose={() => setShowStartModal(false)} onStart={handleStart} />
      )}

      {showPlanModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPlanModal(false)}>
          <div className="modal-content">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold">New Workout Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-5 space-y-4">
              <div>
                <label className="label">Plan Name *</label>
                <input className="input" placeholder="e.g. Upper/Lower Split" value={planForm.name}
                  onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Frequency</label>
                <select className="input" value={planForm.frequency} onChange={e => setPlanForm(f => ({ ...f, frequency: e.target.value }))}>
                  {['3x/week', '4x/week', '5x/week', '6x/week', 'Daily', 'Custom'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
