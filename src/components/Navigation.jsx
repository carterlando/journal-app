import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Settings } from 'lucide-react';

/**
 * Navigation Component
 * 
 * Instagram-style navigation:
 * - Mobile: Bottom bar with icons
 * - Tablet/Desktop: Left sidebar
 */
function Navigation() {
  const location = useLocation();
  
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

  return (
    <>
      {/* Desktop/Tablet Sidebar - Left */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-64 lg:w-72 md:border-r md:border-border md:bg-card/95 md:backdrop-blur-sm md:z-40">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <Link to="/" className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
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

          {/* Footer info */}
          <div className="mt-auto pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
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
    </>
  );
}

export default Navigation;