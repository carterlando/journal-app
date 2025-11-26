import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Settings = lazy(() => import('./pages/Settings'));

/**
 * Loading fallback component
 * Shown while lazy-loaded pages are being fetched
 */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-zinc-400">Loading...</p>
    </div>
  </div>
);

function App() {
  // Initialize app on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize storage system
        const { storage } = await import('./services/storage');
        await storage.init();
        
        // Initialize auth
        await useAuthStore.getState().initialize();
        
        // Load user settings
        await useSettingsStore.getState().loadSettings();
        
        // Load entries if authenticated
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await useEntriesStore.getState().loadEntries();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initialize();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          {/* Global Navigation */}
          <Navigation />
          
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Home page - full screen camera view */}
              <Route path="/" element={<Home />} />
              
              {/* Calendar page - protected route */}
              <Route 
                path="/calendar" 
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                } 
              />
              
              {/* Settings page - protected route */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;