import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Settings } from 'lucide-react';

/**
 * Navigation Component
 * 
 * Responsive navigation with:
 * - Desktop: Top bar with text links
 * - Mobile: Bottom bar with icons
 * - Semi-transparent background with blur
 */
function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  // Desktop link styling
  const linkClass = (path) => `
    px-4 py-2 rounded-lg font-medium transition-colors
    ${isActive(path) 
      ? 'bg-primary text-primary-foreground' 
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }
  `;

  // Mobile link styling
  const mobileNavClass = (path) => `
    flex flex-col items-center justify-center flex-1 py-2 transition-colors
    ${isActive(path)
      ? 'text-primary'
      : 'text-muted-foreground'
    }
  `;

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-40 mb-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Video Journal
            </Link>

            {/* Desktop Nav Links */}
            <div className="flex gap-2">
              <Link to="/" className={linkClass('/')}>
                Home
              </Link>
              <Link to="/entries" className={linkClass('/entries')}>
                All Entries
              </Link>
              <Link to="/settings" className={linkClass('/settings')}>
                Settings
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
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

    </>
  );
}

export default Navigation;