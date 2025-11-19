import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Settings = lazy(() => import('./pages/Settings'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-zinc-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const initialize = async () => {
      try {
        const { storage } = await import('./services/storage');
        await storage.init();
        
        await useAuthStore.getState().initialize();
        await useSettingsStore.getState().loadSettings();
        
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
          {/* No padding for home page (full-screen camera) */}
          <div className={isAuthenticated && window.location.pathname !== '/' ? "md:pl-64 lg:pl-72" : ""}>
            <div className={`${isAuthenticated && window.location.pathname !== '/' ? 'container mx-auto px-4 md:px-6 py-4 md:py-6 pb-20 md:pb-6 max-w-7xl' : ''}`}>
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