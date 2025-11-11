import { useEffect, useState } from 'react';
import useEntriesStore from './stores/entries';
import useAuthStore from './stores/auth';
import useSettingsStore from './stores/settings';
import VideoRecorder from './components/VideoRecorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Main App Component
 * NOW USING SHADCN/UI WITH VIOLET THEME
 */
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
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
        Video Journal
      </h1>

      {/* Main Record Button */}
      <div className="text-center mb-8">
        <Button 
          size="lg"
          onClick={() => setShowRecorder(true)}
          className="text-lg px-8 py-6"
        >
          📹 Record New Entry
        </Button>
      </div>

      {/* Authentication Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Status: {isAuthenticated ? (
              <Badge variant="default">✅ Logged In</Badge>
            ) : (
              <Badge variant="secondary">❌ Not Logged In</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <p className="mb-4">User: {user.name} ({user.email})</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleTestLogin} variant="default">
              Test Login
            </Button>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
          <CardDescription>Total entries: {entries.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAddTestEntry} className="mb-4">
            Add Test Entry
          </Button>
          
          {entries.length > 0 && (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-sm">
                        {new Date(entry.recordedAt).toLocaleString()}
                      </strong>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                    
                    {entry.mediaUrl && entry.type === 'video' && (
                      <video 
                        src={entry.mediaUrl} 
                        controls 
                        className="w-full rounded-md my-2"
                      />
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {entry.transcription || 'No transcription yet'}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{entry.duration}s</Badge>
                      <Badge variant="outline">{entry.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Video Quality: <Badge>{videoQuality}</Badge>
          </p>
          <Button onClick={handleChangeQuality} variant="outline">
            Change Quality
          </Button>
        </CardContent>
      </Card>

      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

export default App;