import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import Habits from './pages/Habits/Habits';
import Missions from './pages/Missions/Missions';
import Routine from './pages/Routine/Routine';
import Focus from './pages/Focus/Focus';
import ScreenTime from './pages/ScreenTime/ScreenTime';
import Analytics from './pages/Analytics/Analytics';
import Rewards from './pages/Rewards/Rewards';
import Journal from './pages/Journal/Journal';
import Tasks from './pages/Tasks/Tasks';
import Workout from './pages/Workout/Workout';
import Settings from './pages/Settings/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.onboarding_complete) return <Navigate to="/app/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="habits" element={<Habits />} />
            <Route path="missions" element={<Missions />} />
            <Route path="routine" element={<Routine />} />
            <Route path="focus" element={<Focus />} />
            <Route path="screen-time" element={<ScreenTime />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="journal" element={<Journal />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="workout" element={<Workout />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
