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

/**
 * Page wrapper for authenticated pages with standard layout
 */
const PageWrapper = ({ children }) => (
  <div className="md:pl-64 lg:pl-72">
    <div className="container mx-auto max-w-7xl">
      {children}
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
          <Navigation />
          
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Home page - full screen, no padding */}
              <Route path="/" element={<Home />} />
              
              {/* Calendar page - with standard layout */}
              <Route 
                path="/calendar" 
                element={
                  <ProtectedRoute>
                    <PageWrapper>
                      <Calendar />
                    </PageWrapper>
                  </ProtectedRoute>
                } 
              />
              
              {/* Settings page - with standard layout */}
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <PageWrapper>
                      <Settings />
                    </PageWrapper>
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