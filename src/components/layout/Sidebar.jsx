import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Target, Zap, Clock, Timer, Monitor,
  BarChart3, Trophy, BookOpen, Kanban, Dumbbell, Settings,
  LogOut, Flame, ChevronRight
} from 'lucide-react';
import { analyticsService } from '../../services/analytics';
import { format } from 'date-fns';

const NAV_GROUPS = [
  {
    label: 'Core',
    items: [
      { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/missions', icon: Target, label: 'Missions' },
      { to: '/app/habits', icon: Zap, label: 'Habits' },
      { to: '/app/routine', icon: Clock, label: 'Routine' },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/app/focus', icon: Timer, label: 'Focus' },
      { to: '/app/workout', icon: Dumbbell, label: 'Workout' },
      { to: '/app/screen-time', icon: Monitor, label: 'Screen Time' },
    ],
  },
  {
    label: 'Projects',
    items: [
      { to: '/app/tasks', icon: Kanban, label: 'Tasks & Boards' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/app/rewards', icon: Trophy, label: 'Rewards' },
      { to: '/app/journal', icon: BookOpen, label: 'Journal' },
    ],
  },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const xp = user ? analyticsService.getTotalXP(user.id) : 0;
  const { level, title, nextLevelXP } = analyticsService.getLevelFromXP(xp);
  const { currentStreak } = user ? analyticsService.getStreak(user.id) : { currentStreak: 0 };
  const xpProgress = nextLevelXP ? Math.round((xp / nextLevelXP) * 100) : 100;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-bg-card border-r border-border flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-sm">D</div>
          <div>
            <h1 className="text-base font-bold tracking-tight gradient-text">DISCIPLINA</h1>
            <p className="text-xs text-text-muted">Build discipline.</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.display_name || 'User'}</p>
            <p className="text-xs text-text-muted">Level {level} · {title}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>{xp.toLocaleString()} XP</span>
            {nextLevelXP && <span>{nextLevelXP.toLocaleString()} XP</span>}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-streak text-xs font-semibold">
            <Flame size={13} />
            <span>{currentStreak} day streak</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="section-title px-3">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        <NavLink to="/app/settings" className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
        <button onClick={handleSignOut} className="nav-item w-full text-left text-danger/70 hover:text-danger hover:bg-danger/10">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
