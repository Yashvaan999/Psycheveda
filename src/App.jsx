import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import AuthScreen from "./screens/AuthScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import DashboardScreen from "./screens/DashboardScreen";
import JournalScreen from "./screens/JournalScreen";
import JournalHistoryScreen from "./screens/JournalHistoryScreen";
import GratitudeScreen from "./screens/GratitudeScreen";
import GratitudeHistoryScreen from "./screens/GratitudeHistoryScreen";
import HpaAxisScreen from "./screens/HpaAxisScreen";
import GoalDetailScreen from "./screens/GoalDetailScreen";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-psy-bg text-psy-subtext">
      <p className="font-display text-2xl">Psycheveda</p>
    </div>
  );
}

function Protected({ children, requireOnboarding = true }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace />;
  if (requireOnboarding && !user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.onboarding_complete ? "/dashboard" : "/onboarding") : "/auth"} replace />} />
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/onboarding" element={
        <Protected requireOnboarding={false}><OnboardingScreen /></Protected>
      } />
      <Route path="/dashboard" element={<Protected><DashboardScreen /></Protected>} />
      <Route path="/journal" element={<Protected><JournalScreen /></Protected>} />
      <Route path="/journal/history" element={<Protected><JournalHistoryScreen /></Protected>} />
      <Route path="/gratitude" element={<Protected><GratitudeScreen /></Protected>} />
      <Route path="/gratitude/history" element={<Protected><GratitudeHistoryScreen /></Protected>} />
      <Route path="/hpa-axis" element={<Protected><HpaAxisScreen /></Protected>} />
      <Route path="/goals/:id" element={<Protected><GoalDetailScreen /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
