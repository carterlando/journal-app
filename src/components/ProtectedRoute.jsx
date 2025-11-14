import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/auth';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication
 * Redirects to home page with auth modal if not logged in
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore();

  // Show nothing while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render the protected content
  return children;
}

export default ProtectedRoute;