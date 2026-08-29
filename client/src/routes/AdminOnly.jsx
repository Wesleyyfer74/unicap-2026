import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminOnly({ children }) {
  const { administrador } = useAuth();
  return administrador?.role === 'ADMIN' ? children : <Navigate to="/admin/chamadas" replace />;
}
