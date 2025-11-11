import { Link, useLocation } from 'react-router-dom';

/**
 * Navigation Component
 * 
 * Main navigation bar for the app.
 */
function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const linkClass = (path) => `
    px-4 py-2 rounded-lg font-medium transition-colors
    ${isActive(path) 
      ? 'bg-violet-600 text-white' 
      : 'text-gray-700 hover:bg-gray-100'
    }
  `;

  return (
    <nav className="bg-white border-b border-gray-200 mb-8">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Video Journal
          </Link>

          {/* Nav Links */}
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
  );
}

export default Navigation;