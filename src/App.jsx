import { useEffect, useState } from 'react';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import VideoRecorder from './components/VideoRecorder';

/**
 * Main App Component
 * 
 * This is the root component of our application.
 * Now includes the VideoRecorder component for testing real video recording.
 */
function App() {
  // ==================== STATE ====================
  
  const [showRecorder, setShowRecorder] = useState(false);

  // ==================== STORE DATA ====================
  
  const { entries, addEntry, deleteEntry } = useEntriesStore();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { videoQuality, updateSetting } = useSettingsStore();

  // ==================== INITIALIZATION ====================
  
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

  // ==================== TEST FUNCTIONS ====================

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

  // ==================== RENDER ====================

  return (
    <div style={styles.container}>
      <h1>Video Journal</h1>

      {/* Main Action: Record New Entry */}
      <div style={styles.recordSection}>
        <button 
          onClick={() => setShowRecorder(true)} 
          style={styles.recordMainButton}
        >
          📹 Record New Entry
        </button>
      </div>

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
                <div style={styles.entryHeader}>
                  <strong>{new Date(entry.recordedAt).toLocaleString()}</strong>
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    style={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
                
                {/* Show video player if entry has media URL */}
                {entry.mediaUrl && entry.type === 'video' && (
                  <video 
                    src={entry.mediaUrl} 
                    controls 
                    style={styles.entryVideo}
                  />
                )}
                
                <p>{entry.transcription || 'No transcription yet'}</p>
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

      {/* Video Recorder Modal */}
      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

// ==================== STYLES ====================

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  },
  recordSection: {
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '30px',
  },
  recordMainButton: {
    padding: '20px 40px',
    fontSize: '20px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
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
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  entryVideo: {
    width: '100%',
    maxHeight: '300px',
    borderRadius: '5px',
    marginTop: '10px',
    marginBottom: '10px',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px',
  },
};

export default App;