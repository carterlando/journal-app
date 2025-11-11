import { useEffect } from 'react';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';

/**
 * Main App Component
 * 
 * This is the root component of our application.
 * Tests our state management stores to ensure they work correctly.
 */
function App() {
  // Get state and actions from our stores
  // Why: Zustand hooks give us access to state and functions from anywhere
  const { entries, addEntry } = useEntriesStore();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { videoQuality, updateSetting } = useSettingsStore();

  // Run once when app loads
  // Why: Load saved auth, settings, AND entries from local storage
  useEffect(() => {
    const initialize = async () => {
      // Try to restore user's logged-in session
      await useAuthStore.getState().loadAuth();
      
      // Load user's saved settings
      await useSettingsStore.getState().loadSettings();
      
      // Load user's saved journal entries
      await useEntriesStore.getState().loadEntries();
    };
    
    initialize();
  }, []);

  // Test function: Simulate user login
  const handleTestLogin = () => {
    setAuth(
      { id: '123', email: 'test@example.com', name: 'Test User' },
      'fake-jwt-token-12345'
    );
  };

  // Test function: Add a dummy journal entry
  const handleAddTestEntry = () => {
    addEntry({
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      type: 'video',
      duration: 120,
      mediaUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      transcription: 'This is a test entry!',
      tags: ['test'],
    });
  };

  // Test function: Change video quality setting
  const handleChangeQuality = () => {
    const qualities = ['low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(videoQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    updateSetting('videoQuality', qualities[nextIndex]);
  };

  return (
    <div style={styles.container}>
      <h1>Video Journal - Testing Stores</h1>

      {/* Authentication Status */}
      <div style={styles.section}>
        <h2>Authentication</h2>
        <p>Status: {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}</p>
        {user && (
          <p>User: {user.name} ({user.email})</p>
        )}
        <button onClick={handleTestLogin} style={styles.button}>
          Test Login
        </button>
        <button onClick={logout} style={styles.button}>
          Logout
        </button>
      </div>

      {/* Entries */}
      <div style={styles.section}>
        <h2>Journal Entries</h2>
        <p>Total entries: {entries.length}</p>
        <button onClick={handleAddTestEntry} style={styles.button}>
          Add Test Entry
        </button>
        
        {entries.length > 0 && (
          <div style={styles.entriesList}>
            {entries.map((entry) => (
              <div key={entry.id} style={styles.entry}>
                <strong>{new Date(entry.recordedAt).toLocaleString()}</strong>
                <p>{entry.transcription}</p>
                <small>Duration: {entry.duration}s | Type: {entry.type}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={styles.section}>
        <h2>Settings</h2>
        <p>Video Quality: <strong>{videoQuality}</strong></p>
        <button onClick={handleChangeQuality} style={styles.button}>
          Change Quality
        </button>
      </div>
    </div>
  );
}

// Inline styles for testing
// Why: Quick styling without setting up CSS files yet
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    marginTop: '30px',
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '8px',
  },
  button: {
    padding: '10px 20px',
    marginRight: '10px',
    marginTop: '10px',
    cursor: 'pointer',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
  },
  entriesList: {
    marginTop: '15px',
  },
  entry: {
    padding: '15px',
    background: 'white',
    borderRadius: '5px',
    marginBottom: '10px',
    border: '1px solid #ddd',
  },
};

export default App;