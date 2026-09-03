import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics';
import { format } from 'date-fns';
import { BookOpen, Plus, Smile, Meh, Frown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays } from 'date-fns';

const { reflectionsStore } = analyticsService;

const MOODS = [
  { value: 5, icon: '😄', label: 'Great' },
  { value: 4, icon: '🙂', label: 'Good' },
  { value: 3, icon: '😐', label: 'Okay' },
  { value: 2, icon: '😔', label: 'Low' },
  { value: 1, icon: '😞', label: 'Rough' },
];

export default function Journal() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editing, setEditing] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const existing = reflectionsStore.where(user.id, r => r.date === selectedDate)[0];
  const [form, setForm] = useState({
    accomplishments: existing?.accomplishments || '',
    distractions: existing?.distractions || '',
    improvements: existing?.improvements || '',
    plan_followed: existing?.plan_followed ?? true,
    mood: existing?.mood || 3,
  });

  const navigateDate = (dir) => {
    const d = dir > 0 ? addDays(new Date(selectedDate), 1) : subDays(new Date(selectedDate), 1);
    const dateStr = format(d, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    const ref = reflectionsStore.where(user.id, r => r.date === dateStr)[0];
    setForm({
      accomplishments: ref?.accomplishments || '',
      distractions: ref?.distractions || '',
      improvements: ref?.improvements || '',
      plan_followed: ref?.plan_followed ?? true,
      mood: ref?.mood || 3,
    });
    setEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (existing) {
      reflectionsStore.update(existing.id, { ...form });
    } else {
      reflectionsStore.create({ user_id: user.id, date: selectedDate, ...form });
      analyticsService.addXP(user.id, 10, 'reflection');
    }
    setEditing(false);
    setRefresh(r => r + 1);
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const moodObj = MOODS.find(m => m.value === (existing?.mood || form.mood));

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Daily Journal</h1>
        <p className="text-text-secondary text-sm mt-0.5">Reflect and grow</p>
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

      {existing && !editing ? (
        /* View mode */
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{moodObj?.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{moodObj?.label}</p>
                  <p className="text-text-muted text-xs">Today's mood</p>
                </div>
              </div>
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-1.5">Edit</button>
            </div>
            <div className="space-y-4">
              {[
                { label: '✅ Accomplished', value: existing.accomplishments },
                { label: '📱 Distractions', value: existing.distractions },
                { label: '🎯 Improvements', value: existing.improvements },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-text leading-relaxed">{value || '—'}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">📋 Followed Plan</p>
                <span className={`badge ${existing.plan_followed ? 'badge-success' : 'badge-danger'}`}>
                  {existing.plan_followed ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit / create mode */
        <form onSubmit={handleSave} className="space-y-4">
          <div className="card">
            <label className="label mb-3">How do you feel today?</label>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  className={`flex-1 py-2.5 rounded-xl border transition-all text-center ${
                    form.mood === m.value ? 'border-accent/40 bg-accent/10' : 'border-border bg-bg-elevated'
                  }`}>
                  <span className="text-xl block">{m.icon}</span>
                  <span className="text-xs text-text-muted">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <label className="label">What did you accomplish today?</label>
              <textarea className="input resize-none h-20"
                placeholder="List your wins, big or small..."
                value={form.accomplishments}
                onChange={e => setForm(f => ({ ...f, accomplishments: e.target.value }))} />
            </div>
            <div>
              <label className="label">What distracted you?</label>
              <textarea className="input resize-none h-16"
                placeholder="Be honest — awareness is the first step..."
                value={form.distractions}
                onChange={e => setForm(f => ({ ...f, distractions: e.target.value }))} />
            </div>
            <div>
              <label className="label">What could you improve tomorrow?</label>
              <textarea className="input resize-none h-16"
                placeholder="One small change that would help..."
                value={form.improvements}
                onChange={e => setForm(f => ({ ...f, improvements: e.target.value }))} />
            </div>
            <div>
              <label className="label">Did you follow your plan?</label>
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button key={String(v)} type="button"
                    onClick={() => setForm(f => ({ ...f, plan_followed: v }))}
                    className={`px-5 py-2 rounded-lg border font-medium text-sm transition-all ${
                      form.plan_followed === v ? 'bg-accent/15 border-accent/40 text-accent-light' : 'bg-bg-elevated border-border text-text-secondary'
                    }`}
                  >
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            )}
            <button type="submit" className="btn-primary flex-1 justify-center">
              <BookOpen size={16} /> {existing ? 'Update' : 'Save'} Reflection {!existing && '+10 XP'}
            </button>
          </div>
        </form>
      )}

      {!existing && !editing && (
        <div className="card text-center py-12">
          <BookOpen size={32} className="text-accent-light mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No Reflection Yet</h3>
          <p className="text-text-secondary text-sm mb-4">Take 2 minutes to reflect on your day.</p>
          <button onClick={() => setEditing(true)} className="btn-primary mx-auto w-fit">
            <Plus size={16} /> Start Reflection
          </button>
        </div>
      )}
    </div>
  );
}
