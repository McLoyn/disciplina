import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createStore } from '../../services/supabase';
import { format } from 'date-fns';
import { Monitor, Plus, X, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const screenTimeStore = createStore('screen_time');
const distractionStore = createStore('distraction_logs');

const CATEGORIES = ['Social Media', 'Gaming', 'YouTube', 'Streaming', 'News', 'Shopping', 'Other'];
const COLORS = ['#6366F1', '#EF4444', '#F59E0B', '#22C55E', '#a78bfa', '#F97316', '#8B929E'];
const DISTRACTION_TYPES = ['YouTube', 'Gaming', 'Social Media', 'Discord', 'Random Browsing', 'Other'];

function LogModal({ onClose, onSave }) {
  const [form, setForm] = useState({ category: 'Social Media', duration: 30, source: 'manual' });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Log Screen Time</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" className="input" min="1" max="720" value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 30 }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DistractionModal({ onClose, onSave }) {
  const [form, setForm] = useState({ category: 'YouTube', duration: 15, note: '' });
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Log Distraction</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-5 space-y-4">
          <div>
            <label className="label">What distracted you?</label>
            <div className="grid grid-cols-2 gap-2">
              {DISTRACTION_TYPES.map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, category: d }))}
                  className={`py-2 px-3 rounded-lg border text-sm transition-all text-left ${form.category === d ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-bg-elevated border-border text-text-secondary'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" className="input" min="1" max="300" value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 15 }))} />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" placeholder="What happened?" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="font-bold">{payload[0].name}</p>
        <p className="text-text-muted">{payload[0].value} min</p>
      </div>
    );
  }
  return null;
};

export default function ScreenTime() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showLog, setShowLog] = useState(false);
  const [showDistraction, setShowDistraction] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const todayLogs = screenTimeStore.where(user.id, s => s.date === today);
  const distractionLogs = distractionStore.where(user.id, d => d.date === today);

  const totalMinutes = todayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
  const dailyLimit = 180; // 3 hours default

  const chartData = CATEGORIES.map((cat, i) => {
    const mins = todayLogs.filter(l => l.category === cat).reduce((s, l) => s + l.duration, 0);
    return { name: cat, value: mins, color: COLORS[i] };
  }).filter(d => d.value > 0);

  const distractionData = DISTRACTION_TYPES.map(d => ({
    name: d.length > 10 ? d.slice(0, 10) + '…' : d,
    fullName: d,
    value: distractionLogs.filter(l => l.category === d).reduce((s, l) => s + l.duration, 0),
  })).filter(d => d.value > 0);

  const handleLogSave = (form) => {
    screenTimeStore.create({ user_id: user.id, date: today, ...form });
    setShowLog(false);
    setRefresh(r => r + 1);
  };

  const handleDistractionSave = (form) => {
    distractionStore.create({ user_id: user.id, date: today, ...form });
    setShowDistraction(false);
    setRefresh(r => r + 1);
  };

  const pct = Math.min(100, Math.round((totalMinutes / dailyLimit) * 100));
  const overLimit = totalMinutes > dailyLimit;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Screen Time</h1>
          <p className="text-text-secondary text-sm mt-0.5">Track your digital usage</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDistraction(true)} className="btn-secondary text-sm">Log Distraction</button>
          <button onClick={() => setShowLog(true)} className="btn-primary"><Plus size={16} /> Log Time</button>
        </div>
      </div>

      {/* Daily summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-text-secondary text-sm">Screen Time Today</p>
          <span className={`badge ${overLimit ? 'badge-danger' : 'badge-success'}`}>
            {overLimit ? 'Over limit' : 'Under limit'}
          </span>
        </div>
        <div className="text-4xl font-bold mt-2 mb-3">
          {Math.floor(totalMinutes / 60)}<span className="text-xl text-text-muted">h</span>{' '}
          {totalMinutes % 60}<span className="text-xl text-text-muted">m</span>
        </div>
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>Daily limit: {Math.floor(dailyLimit / 60)}h</span>
          <span>{pct}%</span>
        </div>
        <div className="progress-bar h-3">
          <div
            className={`h-full rounded-full transition-all duration-700 ${overLimit ? 'bg-danger' : 'bg-gradient-to-r from-accent to-accent-light'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-4 text-sm">By Category</h2>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <Monitor size={28} className="mb-2 opacity-50" />
              <p className="text-sm">No data yet. Log your screen time!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-text-secondary">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 text-sm">Biggest Distractions</h2>
          {distractionData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <Clock size={28} className="mb-2 opacity-50" />
              <p className="text-sm">No distractions logged today.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distractionData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#5A616E', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#8B929E', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#EF4444" radius={4} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Today's logs */}
      {todayLogs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3 text-sm">Today's Entries</h2>
          <div className="space-y-2">
            {todayLogs.map(log => {
              const catIdx = CATEGORIES.indexOf(log.category);
              return (
                <div key={log.id} className="flex items-center gap-3 p-2.5 bg-bg-elevated rounded-lg">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[catIdx] || '#8B929E' }} />
                  <span className="text-sm flex-1">{log.category}</span>
                  <span className="text-sm font-medium text-text-secondary">{log.duration}m</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showLog && <LogModal onClose={() => setShowLog(false)} onSave={handleLogSave} />}
      {showDistraction && <DistractionModal onClose={() => setShowDistraction(false)} onSave={handleDistractionSave} />}
    </div>
  );
}
