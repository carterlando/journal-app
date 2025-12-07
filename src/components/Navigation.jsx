import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Settings } from 'lucide-react';
import useAuthStore from '../stores/auth';

/**
 * Navigation Component
 * 
 * Bottom navigation bar with static layout
 * Shows: Calendar | Record Button | Settings
 * - Layout and design are defined here
 * - Record button functionality is handled by Home.jsx via DOM manipulation
 * - On non-home pages: REC button links to home and triggers recording
 * - Frosted glass background on non-home pages
 * - Active page icon uses accent color (violet)
 * - Padding smoothly reduces on scroll
 */
function Navigation() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const isHomePage = location.pathname === '/';
  const isCalendarPage = location.pathname === '/calendar';
  const isSettingsPage = location.pathname === '/settings';

  /**
   * Track scroll position and calculate shrink progress
   * 0 = fully expanded, 1 = fully compact
   */
  useEffect(() => {
    // Don't apply scroll behavior on home page (full screen camera)
    if (isHomePage) {
      setScrollProgress(0);
      return;
    }

    let ticking = false;
    const maxScroll = 100; // Pixels to scroll for full compact

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const progress = Math.min(window.scrollY / maxScroll, 1);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  if (!isAuthenticated) {
    return null;
  }

  // Interpolate padding based on scroll progress
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const paddingBottom = lerp(32, 12, scrollProgress); // Match homepage at expanded, equal at compact
  const paddingTop = lerp(16, 12, scrollProgress); // Shrinks to match bottom at compact

  return (
    <>
      {/* Bottom Navigation - Fixed to bottom of viewport */}
      <div 
        className={`fixed bottom-0 left-0 right-0 ${
          isHomePage 
            ? '' 
            : 'bg-background/60 backdrop-blur-xl border-t border-border/30'
        }`}
        style={{ 
          zIndex: 20,
          paddingBottom: isHomePage ? 32 : paddingBottom,
          paddingTop: isHomePage ? 0 : paddingTop,
        }}
      >
        <div className="flex items-center justify-center gap-16 px-6">
          {/* Calendar Icon */}
          <Link
            to="/calendar"
            className="w-12 h-12 flex items-center justify-center"
          >
            <Calendar 
              className={`w-7 h-7 ${
                isHomePage 
                  ? 'text-white drop-shadow-lg' 
                  : isCalendarPage 
                    ? 'text-violet-500' 
                    : 'text-muted-foreground'
              }`}
              strokeWidth={1.5} 
            />
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
            // On other pages: link to home with auto-record (same design as homepage but red)
            <Link
              to="/?record=true"
              className="relative"
            >
              {/* Red border ring - same structure as homepage */}
              <svg
                className="absolute top-0 left-0 w-20 h-20"
                style={{ zIndex: 1 }}
              >
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="#dc2626"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.4"
                />
              </svg>
              
              {/* Red inner circle - same size as homepage white circle */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <div className="w-16 h-16 rounded-full bg-red-600" />
              </div>
            </Link>
          )}

          {/* Settings Icon */}
          <Link
            to="/settings"
            className="w-12 h-12 flex items-center justify-center"
          >
            <Settings 
              className={`w-7 h-7 ${
                isHomePage 
                  ? 'text-white drop-shadow-lg' 
                  : isSettingsPage 
                    ? 'text-violet-500' 
                    : 'text-muted-foreground'
              }`}
              strokeWidth={1.5} 
            />
          </Link>
        </div>
      </div>
    </>
  );
}

export default Navigation;