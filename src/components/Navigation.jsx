import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Settings, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../stores/auth';
import AuthModal from './AuthModal';

/**
 * Navigation Component
 * Hidden on home page (camera view)
 * Shows only on Calendar and Settings pages
 */
function Navigation() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  const isHomePage = location.pathname === '/';

  // Mobile nav styling
  const mobileNavClass = (path) => `
    flex flex-col items-center justify-center flex-1 py-3 transition-colors
    ${isActive(path) ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-200'}
  `;

  // Desktop sidebar nav styling
  const sidebarNavClass = (path) => `
    group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden
    ${isActive(path)
      ? 'bg-violet-600/20 text-violet-400'
      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
    }
  `;

  if (!isAuthenticated) {
    return null;
  }

  // Hide navigation on home page (camera view)
  if (isHomePage) {
    return null;
  }

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 lg:w-72 md:border-r md:border-border md:bg-card md:z-40">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <Link to="/" className="mb-10">
            <h1 className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              Story Time
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            <Link to="/" className={sidebarNavClass('/')}>
              <Home className="w-6 h-6" />
              <span className="text-base font-medium">Home</span>
            </Link>
            
            <Link to="/calendar" className={sidebarNavClass('/calendar')}>
              <Calendar className="w-6 h-6" />
              <span className="text-base font-medium">Calendar</span>
            </Link>
            
            <Link to="/settings" className={sidebarNavClass('/settings')}>
              <Settings className="w-6 h-6" />
              <span className="text-base font-medium">Settings</span>
            </Link>
          </nav>

          {/* Footer with User Info */}
          <div className="mt-auto pt-6 border-t border-border space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-lg">
              <User className="w-4 h-4 text-primary" />
              <p className="text-xs text-foreground truncate flex-1">
                {user?.email}
              </p>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
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
          
          <Link to="/calendar" className={mobileNavClass('/calendar')}>
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">Calendar</span>
          </Link>
          
          <Link to="/settings" className={mobileNavClass('/settings')}>
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>

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