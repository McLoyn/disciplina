import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics';
import { format } from 'date-fns';
import { Plus, CheckCircle2, Circle, Trash2, Clock, X } from 'lucide-react';

const { routinesStore, routineLogsStore } = analyticsService;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CATEGORIES = ['Morning', 'Work', 'Study', 'Health', 'Evening', 'Personal'];

function RoutineModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    start_time: '07:00',
    end_time: '08:00',
    category: 'Morning',
    days_of_week: [1, 2, 3, 4, 5],
  });

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter(x => x !== d)
        : [...f.days_of_week, d],
    }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Add Routine Block</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">Activity *</label>
            <input className="input" placeholder="e.g. Morning Workout"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Repeat on</label>
            <div className="flex gap-2">
              {DAYS.map((d, i) => (
                <button key={d} type="button"
                  onClick={() => toggleDay(i + 1)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    form.days_of_week.includes(i + 1) ? 'bg-accent text-white' : 'bg-bg-elevated border border-border text-text-secondary'
                  }`}>
                  {d[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Add Block</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Routine() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDow = new Date().getDay() || 7; // 1-7, Mon=1
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const allRoutines = routinesStore.where(user.id, r => r.is_active !== false);
  const todayRoutines = allRoutines
    .filter(r => !r.days_of_week || r.days_of_week.includes(todayDow))
    .sort((a, b) => a.start_time?.localeCompare(b.start_time));
  const logs = routineLogsStore.where(user.id, l => l.date === today);

  const isDone = (id) => logs.find(l => l.routine_id === id)?.status === 'completed';

  const toggle = (routine) => {
    const done = isDone(routine.id);
    const existing = logs.find(l => l.routine_id === routine.id);
    if (existing) {
      routineLogsStore.update(existing.id, { status: done ? 'pending' : 'completed' });
    } else {
      routineLogsStore.create({
        user_id: user.id,
        routine_id: routine.id,
        date: today,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    }
    setRefresh(r => r + 1);
  };

  const handleSave = (form) => {
    routinesStore.create({ user_id: user.id, ...form, is_active: true });
    setShowModal(false);
    setRefresh(r => r + 1);
  };

  const handleDelete = (id) => {
    routinesStore.update(id, { is_active: false });
    setRefresh(r => r + 1);
  };

  const completedToday = logs.filter(l => l.status === 'completed').length;

  const CATEGORY_COLORS = {
    Morning: 'text-yellow-400',
    Work: 'text-blue-400',
    Study: 'text-purple-400',
    Health: 'text-green-400',
    Evening: 'text-orange-400',
    Personal: 'text-pink-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Routine</h1>
          <p className="text-text-secondary text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Add Block
        </button>
      </div>

      {todayRoutines.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-secondary">Today's Routine</span>
            <span className="text-sm font-bold">{completedToday}/{todayRoutines.length}</span>
          </div>
          <div className="progress-bar h-2">
            <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-700"
              style={{ width: `${todayRoutines.length ? (completedToday / todayRoutines.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {todayRoutines.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-accent-light" />
          </div>
          <h3 className="font-semibold mb-1">No Routine Yet</h3>
          <p className="text-text-secondary text-sm mb-4">Build your daily schedule block by block.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto w-fit">
            <Plus size={16} /> Add First Block
          </button>
        </div>
      ) : (
        <div className="space-y-2 relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border rounded-full" />
          {todayRoutines.map(routine => {
            const done = isDone(routine.id);
            const colorClass = CATEGORY_COLORS[routine.category] || 'text-accent-light';
            return (
              <div key={routine.id} className={`flex items-start gap-4 group ${done ? 'opacity-70' : ''}`}>
                <button onClick={() => toggle(routine)} className="flex-shrink-0 z-10 mt-1">
                  {done
                    ? <CheckCircle2 size={22} className="text-success" />
                    : <Circle size={22} className="text-border hover:text-accent-light transition-colors" />}
                </button>
                <div className={`flex-1 card-hover ${done ? 'bg-success/5 border-success/15' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold text-sm ${done ? 'line-through text-text-muted' : ''}`}>{routine.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${colorClass}`}>{routine.category}</span>
                        <span className="text-xs text-text-muted">
                          {routine.start_time} — {routine.end_time}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(routine.id)}
                      className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 text-danger/60 hover:text-danger transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <RoutineModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
