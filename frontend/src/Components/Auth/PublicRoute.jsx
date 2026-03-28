import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../Hooks/useAuth';

// Redirects logged-in users away from /login, /register etc.
const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
