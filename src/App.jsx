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
 * Mobile: Full screen with bottom nav
 * Desktop: Sidebar nav with max-width content
 */
function App() {
  
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
      <div className="min-h-screen bg-white md:bg-gray-50">
        <Navigation />
        
        {/* Content Area - Mobile: full width, Desktop: offset for sidebar + centered */}
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
  );
}

export default App;