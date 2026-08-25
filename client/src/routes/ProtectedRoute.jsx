import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export default function ProtectedRoute() {
  const { authenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="centered-page"><p>Validando sessão...</p></main>;
  return authenticated ? <Outlet /> : <Navigate to="/admin/login" state={{ from: location }} replace />;
}
