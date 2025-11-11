import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Entries from './pages/Entries';
import Settings from './pages/Settings';

/**
 * Main App Component
 * 
 * Sets up routing and initializes stores on app load.
 */
function App() {
  
  // Initialize all stores on app startup
  useEffect(() => {
    const initialize = async () => {
      await useAuthStore.getState().loadAuth();
      await useSettingsStore.getState().loadSettings();
      await useEntriesStore.getState().loadEntries();
    };
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-6 pb-12 max-w-4xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;