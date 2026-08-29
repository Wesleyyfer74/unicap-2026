import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DashboardPage from '../pages/admin/DashboardPage';

export default function RoleHomeRedirect() {
  const { administrador } = useAuth();
  return administrador?.role === 'FISCAL' ? <Navigate to="/admin/chamadas" replace /> : <DashboardPage />;
}
