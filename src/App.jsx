import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Entries from './pages/Entries';
import Settings from './pages/Settings';
import { ThemeProvider } from './components/ThemeProvider';

/**
 * Main App Component
 */
function App() {
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const initialize = async () => {
      try {
        const { storage } = await import('./services/storage');
        await storage.init();
        console.log('IndexedDB initialized');
        
        await useAuthStore.getState().initialize();
        console.log('Auth initialized');
        
        await useSettingsStore.getState().loadSettings();
        console.log('Settings loaded');
        
        await useEntriesStore.getState().loadEntries();
        console.log('Entries loaded');
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
              <Routes>
                <Route path="/" element={<Home />} />
                <Route 
                  path="/entries" 
                  element={
                    <ProtectedRoute>
                      <Entries />
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
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;