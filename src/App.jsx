import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Entries from './pages/Entries';
import Settings from './pages/Settings';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize IndexedDB storage
        const { storage } = await import('./services/storage');
        await storage.init();
        console.log('IndexedDB initialized');
        
        // Initialize auth (Supabase)
        await useAuthStore.getState().initialize();
        console.log('Auth initialized');
        
        // Load settings
        await useSettingsStore.getState().loadSettings();
        console.log('Settings loaded');
        
        // Load entries (will sync with Supabase later)
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
          <div className="md:pl-64 lg:pl-72">
            <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 pb-20 md:pb-6 max-w-7xl">
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