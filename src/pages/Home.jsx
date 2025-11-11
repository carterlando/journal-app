import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoRecorder from '../components/VideoRecorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

/**
 * Home Page
 * 
 * Main dashboard showing recent entries and record button.
 * This is what users see when they first open the app.
 */
function Home() {
  const [showRecorder, setShowRecorder] = useState(false);
  const { entries, deleteEntry } = useEntriesStore();

  // Get last 5 entries for "recent" view
  const recentEntries = entries.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Hero Section with Record Button */}
      <div className="text-center py-12 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Your Video Journal
        </h1>
        <p className="text-gray-600 mb-6">
          Capture your thoughts, memories, and moments
        </p>
        <Button 
          size="lg"
          onClick={() => setShowRecorder(true)}
          className="text-lg px-8 py-6"
        >
          📹 Record New Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {entries.filter(e => {
                const date = new Date(e.recordedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(entries.reduce((sum, e) => sum + e.duration, 0) / 60)} min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No entries yet</p>
              <p className="text-sm">Click the record button above to create your first entry!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong className="text-sm">
                          {format(new Date(entry.recordedAt), 'PPp')}
                        </strong>
                      </div>
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

      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

export default Home;