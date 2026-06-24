import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={user.role === 'CLIENT' ? '/client/vehicles' : '/mechanic/pending'} replace />;
}
