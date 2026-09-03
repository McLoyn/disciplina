import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { missionsService } from '../../services/missions';
import { analyticsService } from '../../services/analytics';
import { format, addDays, subDays } from 'date-fns';
import {
  Plus, CheckCircle2, Circle, Pencil, Trash2, Target,
  ChevronLeft, ChevronRight, X, MoreHorizontal
} from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['General', 'Study', 'Work', 'Health', 'Personal', 'Creative'];

const PRIORITY_COLOR = {
  High: 'badge-danger',
  Medium: 'badge-warning',
  Low: 'badge-muted',
};

function MissionModal({ mission, date, onClose, onSave }) {
  const [form, setForm] = useState({
    title: mission?.title || '',
    description: mission?.description || '',
    priority: mission?.priority || 'Medium',
    category: mission?.category || 'General',
    estimated_duration: mission?.estimated_duration || '',
    date: mission?.date || date,
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{mission ? 'Edit Mission' : 'Add Mission'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">Mission *</label>
            <input className="input" placeholder="e.g. Study mathematics for 60 min"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-16" placeholder="Optional notes..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Save Mission</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Missions() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showModal, setShowModal] = useState(false);
  const [editMission, setEditMission] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const missions = missionsService.getForDate(user.id, selectedDate);
  const completed = missions.filter(m => m.status === 'completed').length;

  const navigateDate = (dir) => {
    const d = dir > 0
      ? addDays(new Date(selectedDate), 1)
      : subDays(new Date(selectedDate), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const toggle = (mission) => {
    if (mission.status === 'completed') {
      missionsService.uncomplete(mission.id);
    } else {
      missionsService.complete(mission.id);
      analyticsService.addXP(user.id, mission.xp_reward, 'mission', mission.id);
    }
    setRefresh(r => r + 1);
  };

  const handleSave = (form) => {
    if (editMission) {
      missionsService.update(editMission.id, form);
    } else {
      missionsService.create(user.id, form);
    }
    setShowModal(false);
    setEditMission(null);
    setRefresh(r => r + 1);
  };

  const handleDelete = (id) => {
    missionsService.delete(id);
    setMenuOpen(null);
    setRefresh(r => r + 1);
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Missions</h1>
          <p className="text-text-secondary text-sm mt-0.5">Specific targets for the day</p>
        </div>
        <button onClick={() => { setEditMission(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Mission
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigateDate(-1)} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
        <div className="flex-1 text-center">
          <p className="font-semibold">{isToday ? 'Today' : format(new Date(selectedDate + 'T00:00'), 'EEEE')}</p>
          <p className="text-text-muted text-xs">{format(new Date(selectedDate + 'T00:00'), 'MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => navigateDate(1)} className="btn-ghost p-2"><ChevronRight size={18} /></button>
      </div>

      {/* Progress */}
      {missions.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-secondary">Progress</span>
            <span className="font-bold text-sm">{completed}/{missions.length}</span>
          </div>
          <div className="progress-bar h-2">
            <div className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-700"
              style={{ width: `${missions.length ? (completed / missions.length) * 100 : 0}%` }} />
          </div>
          {completed === missions.length && missions.length > 0 && (
            <p className="text-success text-xs mt-2 font-medium">🎯 All missions completed!</p>
          )}
        </div>
      )}

      {/* Missions grouped by priority */}
      {missions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-accent-light" />
          </div>
          <h3 className="font-semibold mb-1">No Missions {isToday ? 'Today' : 'on This Day'}</h3>
          <p className="text-text-secondary text-sm mb-4">{isToday ? 'Your day is clear.' : 'No missions were set.'}</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto w-fit">
            <Plus size={16} /> Add Mission
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {['High', 'Medium', 'Low'].map(priority => {
            const group = missions.filter(m => m.priority === priority);
            if (!group.length) return null;
            return (
              <div key={priority}>
                <p className="section-title mb-2">{priority} Priority</p>
                {group.map(m => (
                  <div key={m.id} className={`card-hover flex items-center gap-3 group mb-2 ${m.status === 'completed' ? 'opacity-70' : ''}`}>
                    <button onClick={() => toggle(m)} className="flex-shrink-0">
                      {m.status === 'completed'
                        ? <CheckCircle2 size={22} className="text-success" />
                        : <Circle size={22} className="text-text-muted hover:text-accent-light transition-colors" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${m.status === 'completed' ? 'line-through text-text-muted' : ''}`}>{m.title}</p>
                      {m.description && <p className="text-text-muted text-xs mt-0.5 truncate">{m.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${PRIORITY_COLOR[m.priority]}`}>{m.priority}</span>
                        <span className="badge-muted badge">{m.category}</span>
                        <span className="text-xs text-accent-light">+{m.xp_reward}xp</span>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                        className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpen === m.id && (
                        <div className="absolute right-0 top-8 bg-bg-elevated border border-border rounded-xl shadow-2xl z-20 min-w-[140px] overflow-hidden">
                          <button onClick={() => { setEditMission(m); setShowModal(true); setMenuOpen(null); }}
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-bg-hover text-sm w-full text-left">
                            <Pencil size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(m.id)}
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-danger/10 text-danger text-sm w-full text-left">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <MissionModal
          mission={editMission}
          date={selectedDate}
          onClose={() => { setShowModal(false); setEditMission(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
