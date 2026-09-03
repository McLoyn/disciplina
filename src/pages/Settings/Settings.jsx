import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Palette, Bell, Shield, ChevronRight, Sun, Moon, Monitor, Save, LogOut, Trash2 } from 'lucide-react';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('account');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    wake_time: user?.wake_time || '06:00',
    sleep_time: user?.sleep_time || '22:00',
    daily_goal: user?.daily_goal || 70,
  });
  const [theme, setTheme] = useState('dark');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    localStorage.clear();
    navigate('/login');
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'discipline', label: 'Discipline', icon: ChevronRight },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-secondary text-sm mt-0.5">Manage your preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-elevated p-1 rounded-xl border border-border w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-bg-card text-text shadow-sm' : 'text-text-secondary hover:text-text'
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Account */}
      {tab === 'account' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold">Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {user?.display_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium">{user?.display_name}</p>
                <p className="text-text-muted text-sm">{user?.email}</p>
              </div>
            </div>

            <div>
              <label className="label">Display Name</label>
              <input className="input" value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold">Schedule</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Wake Time</label>
                <input type="time" className="input" value={form.wake_time}
                  onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))} />
              </div>
              <div>
                <label className="label">Sleep Time</label>
                <input type="time" className="input" value={form.sleep_time}
                  onChange={e => setForm(f => ({ ...f, sleep_time: e.target.value }))} />
              </div>
            </div>
          </div>

          <button type="submit" className={`btn-primary w-full justify-center ${saved ? 'bg-success' : ''}`}>
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>

          <button type="button" onClick={handleSignOut}
            className="btn-ghost w-full justify-center text-danger/70 hover:text-danger hover:bg-danger/10">
            <LogOut size={16} /> Sign Out
          </button>
        </form>
      )}

      {/* Appearance */}
      {tab === 'appearance' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Theme</h2>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={`py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === t.id ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-bg-elevated border-border text-text-secondary'
                }`}>
                <t.icon size={20} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
          <p className="text-text-muted text-xs">Dark mode is currently the only fully supported theme.</p>
        </div>
      )}

      {/* Discipline settings */}
      {tab === 'discipline' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold">Scoring</h2>
            <div>
              <label className="label">Daily Minimum Score (for streak)</label>
              <input type="range" min="50" max="90" step="5" value={form.daily_goal}
                onChange={e => setForm(f => ({ ...f, daily_goal: parseInt(e.target.value) }))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>50 (Easy)</span>
                <span className="text-accent-light font-bold">{form.daily_goal}</span>
                <span>90 (Strict)</span>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold">Score Weights</h2>
            <p className="text-text-muted text-xs">How much each category affects your Discipline Score:</p>
            {[
              { label: 'Missions', weight: '30%' },
              { label: 'Habits', weight: '25%' },
              { label: 'Routine', weight: '20%' },
              { label: 'Focus', weight: '15%' },
              { label: 'Reflection', weight: '10%' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">{s.label}</span>
                <span className="text-sm font-bold text-accent-light">{s.weight}</span>
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary w-full justify-center">
            <Save size={16} /> Save
          </button>
        </form>
      )}

      {/* Privacy */}
      {tab === 'privacy' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="font-semibold">Data</h2>
            <p className="text-text-secondary text-sm">
              All your data is stored locally on this device using localStorage. No data is sent to any server.
            </p>
            <button
              onClick={() => {
                const data = {};
                const keys = ['habits', 'habit_logs', 'missions', 'routines', 'routine_logs',
                  'focus_sessions', 'daily_scores', 'xp_ledger', 'reflections'];
                keys.forEach(k => { data[k] = JSON.parse(localStorage.getItem(`disciplina_${k}`) || '[]'); });
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `disciplina-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="btn-secondary w-full justify-center"
            >
              Export All Data
            </button>
          </div>

          <div className="card space-y-3 border-danger/20">
            <h2 className="font-semibold text-danger">Danger Zone</h2>
            <p className="text-text-muted text-sm">This will permanently delete all your data and cannot be undone.</p>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full justify-center">
                <Trash2 size={16} /> Delete Account & Data
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-danger text-sm font-medium">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button onClick={handleDeleteAccount} className="btn-danger flex-1 justify-center">
                    Yes, Delete Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
