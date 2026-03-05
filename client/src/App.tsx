import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudioPage from './pages/StudioPage';
import StudioSettingsPage from './pages/StudioSettingsPage';
import ChartBuilderPage from './pages/ChartBuilderPage';
import SessionPlayerPage from './pages/SessionPlayerPage';
import ProgressPage from './pages/ProgressPage';
import SessionHistoryPage from './pages/SessionHistoryPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/studios/:id" element={<StudioPage />} />
        <Route path="/studios/:id/settings" element={<StudioSettingsPage />} />
        <Route path="/studios/:id/charts/new" element={<ChartBuilderPage />} />
        <Route path="/charts/:id/edit" element={<ChartBuilderPage />} />
        <Route path="/charts/:id/practice" element={<SessionPlayerPage />} />
        <Route path="/studios/:id/progress" element={<ProgressPage />} />
        <Route path="/studios/:id/sessions" element={<SessionHistoryPage />} />
        {/* Fallback routes for mobile tab bar */}
        <Route path="/practice" element={<DashboardPage />} />
        <Route path="/progress" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProfilePlaceholder() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
      {user && (
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-extrabold text-3xl mx-auto">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{user.displayName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
