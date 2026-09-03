import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Zap, Timer, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/app/missions', icon: Target, label: 'Missions' },
  { to: '/app/habits', icon: Zap, label: 'Habits' },
  { to: '/app/focus', icon: Timer, label: 'Focus' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border z-40 lg:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isActive ? 'text-accent-light' : 'text-text-muted'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
