import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore.js';
import Spinner from './auth/Spinner.jsx';

export default function GuestRoute({ children }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spinner size="md" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
