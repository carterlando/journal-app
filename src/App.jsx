import { useEffect, useState } from 'react';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import VideoRecorder from './components/VideoRecorder';

function App() {
  const [showRecorder, setShowRecorder] = useState(false);
  const { entries, addEntry, deleteEntry } = useEntriesStore();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { videoQuality, updateSetting } = useSettingsStore();

  useEffect(() => {
    const initialize = async () => {
      await useAuthStore.getState().loadAuth();
      await useSettingsStore.getState().loadSettings();
      await useEntriesStore.getState().loadEntries();
    };
    initialize();
  }, []);

  const handleTestLogin = () => {
    setAuth(
      { id: '123', email: 'test@example.com', name: 'Test User' },
      'fake-jwt-token-12345'
    );
  };

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

  const handleChangeQuality = () => {
    const qualities = ['low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(videoQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    updateSetting('videoQuality', qualities[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Test: This text should be LARGE and PURPLE */}
        <h1 className="text-6xl font-bold text-purple-600 mb-8 text-center">
          Video Journal TEST
        </h1>

        {/* Test: This button should be BLUE with white text */}
        <div className="text-center mb-8">
          <button 
            onClick={() => setShowRecorder(true)}
            className="bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600"
          >
            📹 Record New Entry
          </button>
        </div>

        {/* Test: This should be a white card with shadow */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
          <p className="mb-4">Status: {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}</p>
          {user && <p className="mb-4">User: {user.name} ({user.email})</p>}
          
          <div className="flex gap-2">
            <button 
              onClick={handleTestLogin}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Login
            </button>
            <button 
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Test: Another card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Journal Entries</h2>
          <p className="mb-4">Total: {entries.length}</p>
          
          <button 
            onClick={handleAddTestEntry}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mb-4"
          >
            Add Test Entry
          </button>

          {entries.length > 0 && (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-sm">{new Date(entry.recordedAt).toLocaleString()}</strong>
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {entry.mediaUrl && entry.type === 'video' && (
                    <video src={entry.mediaUrl} controls className="w-full rounded my-2" />
                  )}
                  
                  <p className="text-sm text-gray-600 mb-2">{entry.transcription || 'No transcription'}</p>
                  <div className="flex gap-2">
                    <span className="bg-gray-200 px-2 py-1 rounded text-xs">{entry.duration}s</span>
                    <span className="bg-blue-200 px-2 py-1 rounded text-xs">{entry.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <p className="mb-4">Video Quality: <span className="bg-yellow-200 px-2 py-1 rounded">{videoQuality}</span></p>
          <button 
            onClick={handleChangeQuality}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            Change Quality
          </button>
        </div>

        {showRecorder && (
          <VideoRecorder onClose={() => setShowRecorder(false)} />
        )}
      </div>
    </div>
  );
}

export default App;