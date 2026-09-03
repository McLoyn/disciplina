import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { habitsService } from '../../services/habits';
import { analyticsService } from '../../services/analytics';
import { format } from 'date-fns';
import {
  Plus, CheckCircle2, Circle, MoreHorizontal, Pencil,
  Trash2, Zap, X, AlertCircle
} from 'lucide-react';

const CATEGORIES = ['General', 'Study', 'Health', 'Exercise', 'Mindfulness', 'Sleep', 'Social', 'Creative'];
const FREQUENCIES = ['Daily', 'Weekdays', 'Weekends', 'Custom'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function HabitModal({ habit, onClose, onSave }) {
  const [form, setForm] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    category: habit?.category || 'General',
    frequency: habit?.frequency || 'Daily',
    difficulty: habit?.difficulty || 'Medium',
    target_value: habit?.target_value || 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{habit ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Habit Name *</label>
            <input className="input" placeholder="e.g. Read 20 pages" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-20" placeholder="Optional description..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.difficulty === d ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-bg-elevated border-border text-text-secondary'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1">
              XP reward: Easy +5 · Medium +10 · Hard +20
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Save Habit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Habits() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [refresh, setRefresh] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const habits = habitsService.getAll(user.id);
  const logs = habitsService.getLogsForDate(user.id, today);

  const getLog = (habitId) => logs.find(l => l.habit_id === habitId);
  const isDone = (habitId) => getLog(habitId)?.status === 'Completed';

  const toggle = (habit) => {
    const done = isDone(habit.id);
    const newStatus = done ? 'Not Completed' : 'Completed';
    habitsService.logHabit(user.id, habit.id, today, newStatus);
    if (!done) analyticsService.addXP(user.id, habit.xp_reward, 'habit', habit.id);
    setRefresh(r => r + 1);
  };

  const handleSave = (form) => {
    if (editHabit) {
      habitsService.update(editHabit.id, form);
    } else {
      habitsService.create(user.id, form);
    }
    setShowModal(false);
    setEditHabit(null);
    setRefresh(r => r + 1);
  };

  const handleDelete = (id) => {
    habitsService.delete(id);
    setMenuOpen(null);
    setRefresh(r => r + 1);
  };

  const completedToday = logs.filter(l => l.status === 'Completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-text-secondary text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <button onClick={() => { setEditHabit(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* Progress summary */}
      {habits.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Today's Progress</span>
            <span className="text-sm font-bold">{completedToday}/{habits.length}</span>
          </div>
          <div className="progress-bar h-2">
            <div className="progress-fill h-full" style={{ width: `${habits.length ? (completedToday / habits.length) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-2">
            {completedToday === habits.length && habits.length > 0 ? '🎉 All habits done today!' : `${habits.length - completedToday} remaining`}
          </p>
        </div>
      )}

      {/* Habit list */}
      {habits.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-accent-light" />
          </div>
          <h3 className="font-semibold mb-1">No Habits Yet</h3>
          <p className="text-text-secondary text-sm mb-4">Start with one small habit.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto w-fit">
            <Plus size={16} /> Create Habit
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => {
            const done = isDone(habit.id);
            return (
              <div
                key={habit.id}
                className={`card-hover flex items-center gap-3 group ${done ? 'opacity-70' : ''}`}
              >
                <button onClick={() => toggle(habit)} className="flex-shrink-0">
                  {done
                    ? <CheckCircle2 size={22} className="text-success" />
                    : <Circle size={22} className="text-text-muted hover:text-accent-light transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${done ? 'line-through text-text-muted' : ''}`}>{habit.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge-muted badge text-xs">{habit.category}</span>
                    <span className="text-xs text-text-muted">{habit.frequency}</span>
                    <span className={`text-xs font-medium ${
                      habit.difficulty === 'Hard' ? 'text-danger' : habit.difficulty === 'Easy' ? 'text-success' : 'text-warning'
                    }`}>{habit.difficulty}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent-light font-medium hidden sm:block">+{habit.xp_reward} XP</span>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === habit.id ? null : habit.id)}
                      className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuOpen === habit.id && (
                      <div className="absolute right-0 top-8 bg-bg-elevated border border-border rounded-xl shadow-2xl z-20 min-w-[140px] overflow-hidden">
                        <button
                          onClick={() => { setEditHabit(habit); setShowModal(true); setMenuOpen(null); }}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-bg-hover text-sm w-full text-left"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(habit.id)}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-danger/10 text-danger text-sm w-full text-left"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <HabitModal
          habit={editHabit}
          onClose={() => { setShowModal(false); setEditHabit(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
