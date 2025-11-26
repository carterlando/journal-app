import { Link, useLocation } from 'react-router-dom';
import { Calendar, Settings, Home } from 'lucide-react';
import useAuthStore from '../stores/auth';
import { useTheme } from 'next-themes';

/**
 * Navigation Component
 * 
 * Bottom navigation bar with static layout
 * Shows: Calendar | Record Button | Settings
 * - Layout and design are defined here
 * - Record button functionality is handled by Home.jsx via DOM manipulation
 * - On non-home pages: Record button links to home with home icon
 */
function Navigation() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { theme, systemTheme } = useTheme();
  
  const isHomePage = location.pathname === '/';
  
  // Determine if we're in light mode
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isLightMode = currentTheme === 'light';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation - Fixed to bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 pb-8" style={{ zIndex: 20 }}>
        <div className="flex items-center justify-center gap-16 px-6">
          {/* Calendar Icon */}
          <Link
            to="/calendar"
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
              isHomePage 
                ? 'hover:bg-black/20' 
                : isLightMode 
                  ? 'bg-black/80 hover:bg-black/90' 
                  : 'hover:bg-black/20'
            }`}
          >
            <Calendar className={`w-7 h-7 drop-shadow-lg ${
              isHomePage || isLightMode ? 'text-white' : 'text-white'
            }`} strokeWidth={1.5} />
          </Link>

          {/* Record Button - Static design, functionality added by Home.jsx */}
          {isHomePage ? (
            // On home page: button element for Home.jsx to control
            <button
              id="record-button"
              className="relative"
            >
              {/* Progress ring that fills the border (RED) */}
              <svg
                id="record-progress-ring"
                className="absolute top-0 left-0 w-20 h-20 -rotate-90"
                style={{ zIndex: 1 }}
              >
                {/* Background white border circle */}
                <circle
                  id="record-progress-bg"
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  opacity="1"
                  className="transition-opacity duration-500 ease-in-out"
                />
                {/* Red progress circle (only visible when recording) */}
                <circle
                  id="record-progress-fill"
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#dc2626"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36}`}
                  className="transition-all duration-200 ease-linear"
                  strokeLinecap="round"
                  style={{ display: 'none' }}
                />
              </svg>
              
              {/* Button inner shape - smooth transition: white circle → red square */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <div 
                  id="record-button-inner"
                  style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
              </div>
            </button>
          ) : (
            // On other pages: link to home with home icon (no outer ring)
            <Link
              to="/"
              className="relative"
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                  }}
                >
                  <Home className="w-8 h-8 text-black" strokeWidth={1.5} />
                </div>
              </div>
            </Link>
          )}

          {/* Settings Icon */}
          <Link
            to="/settings"
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
              isHomePage 
                ? 'hover:bg-black/20' 
                : isLightMode 
                  ? 'bg-black/80 hover:bg-black/90' 
                  : 'hover:bg-black/20'
            }`}
          >
            <Settings className={`w-7 h-7 drop-shadow-lg ${
              isHomePage || isLightMode ? 'text-white' : 'text-white'
            }`} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </>
  );
}

export default Navigation;