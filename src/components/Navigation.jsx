import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Settings } from 'lucide-react';

/**
 * Navigation Component
 * 
 * Mobile: Bottom tab bar
 * Desktop: Left sidebar
 * Supports light/dark mode
 */
function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/entries', icon: Video, label: 'Entries' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {tabs.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'fill-violet-600 dark:fill-violet-400' : ''}`} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50">
        <div className="p-6">
          {/* Logo */}
          <Link to="/" className="block mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Video Journal
            </h1>
          </Link>

          {/* Nav Links */}
          <div className="space-y-2">
            {tabs.map(({ path, icon: Icon, label }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active 
                      ? 'bg-violet-600 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'fill-white' : ''}`} />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;