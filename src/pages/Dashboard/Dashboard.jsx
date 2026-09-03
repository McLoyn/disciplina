import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics';
import { habitsService } from '../../services/habits';
import { missionsService } from '../../services/missions';
import { tasksService } from '../../services/tasks';
import { workoutService } from '../../services/workout';
import {
  Flame, Zap, Target, Timer, Monitor, Kanban, Dumbbell,
  CheckCircle2, Circle, ChevronRight, TrendingUp, Star
} from 'lucide-react';

function ScoreRing({ score }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="score-ring -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#242830" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold">{score}</div>
        <div className="text-xs text-text-muted">/ 100</div>
      </div>
    </div>
  );
}

function GreetingText() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

function MiniProgress({ value, max, color = 'bg-accent' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-bar">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const today = format(new Date(), 'yyyy-MM-dd');

  const score = analyticsService.calculateDailyScore(user.id, today);
  const streak = analyticsService.getStreak(user.id);
  const xp = analyticsService.getTotalXP(user.id);
  const { level, title: levelTitle, nextLevelXP } = analyticsService.getLevelFromXP(xp);
  const focusStats = analyticsService.getFocusStats(user.id, today);
  const habits = habitsService.getAll(user.id);
  const habitLogs = habitsService.getLogsForDate(user.id, today);
  const missions = missionsService.getForDate(user.id, today);
  const taskStats = tasksService.getStats(user.id);
  const workoutStats = workoutService.getWeeklyStats(user.id);

  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const completedHabits = habitLogs.filter(l => l.status === 'Completed').length;

  const toggleMission = (mission) => {
    if (mission.status === 'completed') {
      missionsService.uncomplete(mission.id);
    } else {
      missionsService.complete(mission.id);
      analyticsService.addXP(user.id, mission.xp_reward, 'mission', mission.id);
    }
    setRefresh(r => r + 1);
  };

  const toggleHabit = (habit) => {
    const log = habitLogs.find(l => l.habit_id === habit.id);
    const newStatus = log?.status === 'Completed' ? 'Not Completed' : 'Completed';
    habitsService.logHabit(user.id, habit.id, today, newStatus);
    if (newStatus === 'Completed') {
      analyticsService.addXP(user.id, habit.xp_reward, 'habit', habit.id);
    }
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{GreetingText()}</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {user?.display_name ? `${user.display_name}, ` : ''}
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-streak/10 border border-streak/20 text-streak rounded-lg px-3 py-1.5 text-sm font-bold">
              <Flame size={16} />
              <span>{streak.currentStreak}d</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent-light rounded-lg px-3 py-1.5 text-sm font-bold">
            <Star size={14} />
            <span>Lv {level}</span>
          </div>
        </div>
      </div>

      {/* Score + XP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Discipline Score */}
        <div className="card sm:col-span-1 flex flex-col items-center py-6 glow-accent">
          <ScoreRing score={score.total_score} />
          <p className="text-sm font-semibold mt-3">Discipline Score</p>
          <div className="flex gap-4 mt-3 text-xs text-text-muted">
            <span>Mission {score.mission_score}%</span>
            <span>Habit {score.habit_score}%</span>
          </div>
        </div>

        {/* Right stats */}
        <div className="sm:col-span-2 space-y-4">
          {/* Streak + XP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <div className="flex items-center gap-2 text-streak mb-2">
                <Flame size={18} />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Streak</span>
              </div>
              <div className="text-2xl font-bold">{streak.currentStreak}</div>
              <div className="text-xs text-text-muted">days current</div>
              <div className="text-xs text-text-muted mt-1">Best: {streak.bestStreak}d</div>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-accent-light mb-2">
                <Zap size={18} />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">XP</span>
              </div>
              <div className="text-2xl font-bold">{xp.toLocaleString()}</div>
              <div className="text-xs text-text-muted">{levelTitle}</div>
              {nextLevelXP && (
                <div className="mt-2">
                  <MiniProgress value={xp} max={nextLevelXP} />
                  <div className="text-xs text-text-muted mt-1">{nextLevelXP - xp} XP to next level</div>
                </div>
              )}
            </div>
          </div>

          {/* Focus + Screen Time */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/app/focus" className="card-hover group">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Timer size={16} />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Focus</span>
              </div>
              <div className="text-xl font-bold">{Math.floor(focusStats.totalMinutes / 60)}h {focusStats.totalMinutes % 60}m</div>
              <div className="text-xs text-text-muted">{focusStats.sessions} session{focusStats.sessions !== 1 ? 's' : ''} today</div>
            </Link>
            <Link to="/app/tasks" className="card-hover">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Kanban size={16} />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Tasks</span>
              </div>
              <div className="text-xl font-bold">{taskStats.done}/{taskStats.total}</div>
              <div className="text-xs text-text-muted">{taskStats.active} active boards</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Missions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Today's Missions</h2>
            <p className="text-text-muted text-xs">{completedMissions}/{missions.length} completed</p>
          </div>
          <Link to="/app/missions" className="text-accent-light text-sm flex items-center gap-1 hover:underline">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No missions today.</p>
            <Link to="/app/missions" className="btn-primary mt-3 mx-auto w-fit text-sm">Add Mission</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {missions.slice(0, 5).map(m => (
              <button
                key={m.id}
                onClick={() => toggleMission(m)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                  m.status === 'completed'
                    ? 'bg-success/5 border-success/20 opacity-70'
                    : 'bg-bg-elevated border-border hover:border-border-light'
                }`}
              >
                {m.status === 'completed'
                  ? <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                  : <Circle size={18} className="text-text-muted flex-shrink-0" />}
                <span className={`text-sm flex-1 ${m.status === 'completed' ? 'line-through text-text-muted' : ''}`}>
                  {m.title}
                </span>
                <span className={`badge text-xs ${m.priority === 'High' ? 'badge-danger' : m.priority === 'Low' ? 'badge-muted' : 'badge-warning'}`}>
                  {m.priority}
                </span>
              </button>
            ))}
          </div>
        )}

        {missions.length > 0 && (
          <div className="mt-3">
            <MiniProgress value={completedMissions} max={missions.length} color="bg-success" />
          </div>
        )}
      </div>

      {/* Habits + Workout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Habits */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <h2 className="font-semibold text-sm">Habits</h2>
            </div>
            <Link to="/app/habits" className="text-accent-light text-xs flex items-center gap-1 hover:underline">
              All <ChevronRight size={12} />
            </Link>
          </div>
          {habits.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-text-muted text-xs">No habits yet.</p>
              <Link to="/app/habits" className="text-accent-light text-xs mt-1 block hover:underline">Create habit</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.slice(0, 5).map(h => {
                const log = habitLogs.find(l => l.habit_id === h.id);
                const done = log?.status === 'Completed';
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHabit(h)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 text-left ${
                      done ? 'bg-success/5 border-success/15 opacity-70' : 'bg-bg-elevated border-border hover:border-border-light'
                    }`}
                  >
                    {done
                      ? <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                      : <Circle size={16} className="text-text-muted flex-shrink-0" />}
                    <span className={`text-sm flex-1 ${done ? 'line-through text-text-muted' : ''}`}>{h.name}</span>
                    <span className="text-xs text-text-muted">+{h.xp_reward}xp</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-3 text-xs text-text-muted">
            {completedHabits}/{habits.length} completed
          </div>
        </div>

        {/* Workout */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell size={16} className="text-green-400" />
              <h2 className="font-semibold text-sm">Workout This Week</h2>
            </div>
            <Link to="/app/workout" className="text-accent-light text-xs flex items-center gap-1 hover:underline">
              Track <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Sessions</span>
              <span className="font-bold">{workoutStats.sessions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Total Time</span>
              <span className="font-bold">{Math.floor(workoutStats.totalMinutes / 60)}h {workoutStats.totalMinutes % 60}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Consistency</span>
              <span className="font-bold text-success">{workoutStats.consistency}%</span>
            </div>
            <MiniProgress value={workoutStats.consistency} max={100} color="bg-success" />
          </div>
        </div>
      </div>

      {/* Quick action */}
      <Link to="/app/focus" className="block card border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-all">
              <Timer size={20} className="text-accent-light" />
            </div>
            <div>
              <p className="font-semibold text-sm">Start Focus Session</p>
              <p className="text-text-muted text-xs">Pomodoro • Deep Work • Custom</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-text-muted group-hover:text-text transition-colors" />
        </div>
      </Link>
    </div>
  );
}
