import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore.js';
import Spinner from './auth/Spinner.jsx';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
