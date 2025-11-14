import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Settings, LogIn, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../stores/auth';
import AuthModal from './AuthModal';

/**
 * Navigation Component
 * 
 * Only visible when user is authenticated
 */
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const isActive = (path) => location.pathname === path;

  // Mobile bottom nav styling
  const mobileNavClass = (path) => `
    flex flex-col items-center justify-center flex-1 py-2 transition-colors
    ${isActive(path)
      ? 'text-primary'
      : 'text-muted-foreground'
    }
  `;

  // Desktop sidebar nav styling
  const sidebarNavClass = (path) => `
    flex items-center gap-4 px-4 py-3 rounded-lg transition-all
    ${isActive(path)
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-foreground hover:bg-accent'
    }
  `;

  // Don't show navigation if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop/Tablet Sidebar - Left */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 lg:w-72 md:border-r md:border-border md:bg-card md:z-40">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <Link to="/" className="mb-8">
            <h1 className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              Video Journal
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            <Link to="/" className={sidebarNavClass('/')}>
              <Home className="w-6 h-6" />
              <span className="text-base">Home</span>
            </Link>
            <Link to="/entries" className={sidebarNavClass('/entries')}>
              <Grid className="w-6 h-6" />
              <span className="text-base">All Entries</span>
            </Link>
            <Link to="/settings" className={sidebarNavClass('/settings')}>
              <Settings className="w-6 h-6" />
              <span className="text-base">Settings</span>
            </Link>
          </nav>

          {/* Footer with Auth */}
          <div className="mt-auto pt-6 border-t border-border space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg">
              <User className="w-4 h-4 text-primary" />
              <p className="text-xs text-foreground truncate flex-1">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <p className="text-xs text-muted-foreground text-center">
              © 2025 Video Journal
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-40">
        <div className="flex justify-around">
          <Link to="/" className={mobileNavClass('/')}>
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/entries" className={mobileNavClass('/entries')}>
            <Grid className="w-6 h-6" />
            <span className="text-xs mt-1">Entries</span>
          </Link>
          <Link to="/settings" className={mobileNavClass('/settings')}>
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>

      {/* Mobile padding spacer */}
      <div className="md:hidden h-16"></div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}

export default Navigation;