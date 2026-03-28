import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../Components/Auth/ProtectedRoute';
import PublicRoute from '../Components/Auth/PublicRoute';
import AppLayout from '../Layouts/AppLayout';

const Login = lazy(() => import('../Pages/Auth/Login'));
const Register = lazy(() => import('../Pages/Auth/Register'));
const ForgotPasswordPage = lazy(() => import('../Pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() =>
  import('../Pages/Auth/ForgotPassword').then((module) => ({
    default: module.ResetPassword,
  }))
);
const VerifyEmail = lazy(() =>
  import('../Pages/Auth/ForgotPassword').then((module) => ({
    default: module.VerifyEmail,
  }))
);
const Dashboard = lazy(() => import('../Pages/Dashboard'));
const Analytics = lazy(() => import('../Pages/Analytics'));
const Session = lazy(() => import('../Pages/Session'));
const Calendar = lazy(() => import('../Pages/Calendar'));
const Profile = lazy(() =>
  import('../Pages/Profile').then((module) => ({ default: module.Profile }))
);
const NotFound = lazy(() => import('../Pages/NotFound'));

const RouteFallback = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-[#8ff6d0]">Loading</p>
      <p className="mt-3 text-sm text-[#bdc9c2]">Preparing the next workspace view.</p>
    </div>
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/session" element={<Session />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;

