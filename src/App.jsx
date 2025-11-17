import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';

// Lazy load pages for code splitting
// Why: Reduces initial bundle size by loading pages only when needed
const Home = lazy(() => import('./pages/Home'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Settings = lazy(() => import('./pages/Settings'));

/**
 * Loading fallback component
 * Shown while lazy-loaded pages are being fetched
 */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

/**
 * Main App Component
 */
function App() {
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize IndexedDB storage (for temporary video storage only)
        const { storage } = await import('./services/storage');
        await storage.init();
        console.log('IndexedDB initialized');
        
        // Initialize auth (Supabase)
        await useAuthStore.getState().initialize();
        console.log('Auth initialized');
        
        // Load settings
        await useSettingsStore.getState().loadSettings();
        console.log('Settings loaded');
        
        // Load entries ONLY if authenticated
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await useEntriesStore.getState().loadEntries();
          console.log('Entries loaded');
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
          {/* Only add padding when authenticated (nav is visible) */}
          <div className={isAuthenticated ? "md:pl-64 lg:pl-72" : ""}>
            <div className={`container mx-auto px-4 md:px-6 py-4 md:py-6 ${isAuthenticated ? 'pb-20 md:pb-6' : ''} max-w-7xl`}>
              {/* Suspense wrapper for lazy-loaded routes */}
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/calendar" 
                    element={
                      <ProtectedRoute>
                        <Calendar />
                      </ProtectedRoute>
                    } 
                  />
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
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;