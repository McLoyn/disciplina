import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics';
import { format, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-bold">{p.value}{p.name === 'score' ? '' : '%'}</p>
        ))}
      </div>
    );
  }
  return null;
};

function ScoreBadge({ value, prevValue }) {
  if (prevValue === undefined || value === prevValue) return <Minus size={14} className="text-text-muted" />;
  if (value > prevValue) return (
    <span className="flex items-center gap-0.5 text-success text-xs">
      <TrendingUp size={13} />+{value - prevValue}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-danger text-xs">
      <TrendingDown size={13} />{value - prevValue}
    </span>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(7);

  const history = analyticsService.getScoreHistory(user.id, period);
  const currentScore = analyticsService.calculateDailyScore(user.id, format(new Date(), 'yyyy-MM-dd'));
  const streak = analyticsService.getStreak(user.id);
  const xp = analyticsService.getTotalXP(user.id);
  const { level, title } = analyticsService.getLevelFromXP(xp);

  const chartData = history.map(h => ({
    date: format(new Date(h.date + 'T00:00'), 'MMM d'),
    score: h.score,
  }));

  const avgScore = Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length) || 0;

  const breakdown = [
    { name: 'Missions', value: currentScore.mission_score, color: '#6366F1' },
    { name: 'Habits', value: currentScore.habit_score, color: '#22C55E' },
    { name: 'Routine', value: currentScore.routine_score, color: '#F59E0B' },
    { name: 'Focus', value: currentScore.focus_score, color: '#a78bfa' },
    { name: 'Reflection', value: currentScore.reflection_score, color: '#EF4444' },
  ];

  const DIMENSIONS = [
    { key: 'Consistency', value: Math.min(100, Math.round((streak.currentStreak / 30) * 100 + avgScore * 0.5)) },
    { key: 'Completion', value: currentScore.mission_score },
    { key: 'Focus', value: currentScore.focus_score },
    { key: 'Routine', value: currentScore.routine_score },
    { key: 'Reflection', value: currentScore.reflection_score },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-text-secondary text-sm mt-0.5">Discipline Intelligence</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map(d => (
          <button key={d}
            onClick={() => setPeriod(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === d ? 'bg-accent/15 border border-accent/40 text-accent-light' : 'bg-bg-elevated border border-border text-text-secondary'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Avg Score', value: avgScore, unit: '/100' },
          { label: 'Streak', value: streak.currentStreak, unit: 'd' },
          { label: 'Best Streak', value: streak.bestStreak, unit: 'd' },
          { label: 'Successful Days', value: streak.successfulDays, unit: '' },
        ].map(m => (
          <div key={m.label} className="card">
            <p className="text-text-muted text-xs mb-1">{m.label}</p>
            <p className="text-2xl font-bold">{m.value}<span className="text-sm text-text-muted">{m.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Score over time */}
      <div className="card">
        <h2 className="font-semibold mb-4">Discipline Score — {period} Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#5A616E', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#5A616E', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2}
              fill="url(#areaGrad)" dot={{ fill: '#6366F1', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Today's breakdown + Bar chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-4">Today's Breakdown</h2>
          <div className="space-y-3">
            {breakdown.map(b => (
              <div key={b.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">{b.name}</span>
                  <span className="font-bold" style={{ color: b.color }}>{b.value}%</span>
                </div>
                <div className="progress-bar">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${b.value}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Dimension Analysis</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DIMENSIONS} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#5A616E', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="key" width={80} tick={{ fill: '#8B929E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={4} fill="url(#barGrad)">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best & Weakest */}
      <div className="grid grid-cols-2 gap-4">
        {(() => {
          const sorted = [...DIMENSIONS].sort((a, b) => b.value - a.value);
          const best = sorted[0];
          const worst = sorted[sorted.length - 1];
          return [
            { label: 'Best Area', item: best, color: 'text-success', bg: 'bg-success/10 border-success/20' },
            { label: 'Weakest Area', item: worst, color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
          ].map(({ label, item, color, bg }) => (
            <div key={label} className={`card border ${bg}`}>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">{label}</p>
              <p className={`font-bold ${color}`}>{item.key}</p>
              <p className="text-2xl font-bold mt-1">{item.value}<span className="text-sm text-text-muted">/100</span></p>
            </div>
          ));
        })()}
      </div>

      {/* Insight card */}
      {avgScore > 0 && (
        <div className="card border-accent/20 bg-accent/5">
          <p className="text-xs text-accent-light font-semibold uppercase tracking-wide mb-2">📈 Insight</p>
          <p className="text-sm">
            {avgScore >= 80
              ? `Your average discipline score is ${avgScore}/100 over the past ${period} days. You're performing consistently well.`
              : avgScore >= 60
              ? `Your average score is ${avgScore}/100. Focus on ${DIMENSIONS.sort((a, b) => a.value - b.value)[0].key.toLowerCase()} to improve.`
              : `Your average score is ${avgScore}/100. Start with small wins — complete one habit and one mission today.`}
          </p>
        </div>
      )}
    </div>
  );
}
