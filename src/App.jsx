import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import { ThemeProvider } from './components/ThemeProvider';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Entries from './pages/Entries';
import Settings from './pages/Settings';

/**
 * Main App Component
 * 
 * Wrapped with ThemeProvider for dark mode support.
 */
function App() {
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize IndexedDB storage FIRST
        const { storage } = await import('./services/storage');
        await storage.init();
        console.log('IndexedDB initialized');
        
        // Then load data from stores
        await useAuthStore.getState().loadAuth();
        await useSettingsStore.getState().loadSettings();
        await useEntriesStore.getState().loadEntries();
        console.log('Stores loaded');
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initialize();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navigation />
          
          <div className="md:ml-64">
            <div className="md:max-w-3xl md:mx-auto md:px-8 md:py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/entries" element={<Entries />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;