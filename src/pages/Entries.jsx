import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoRecorder from '../components/VideoRecorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * Entries Page
 * 
 * Full list of all journal entries with search functionality.
 */
function Entries() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { entries, deleteEntry, searchEntries } = useEntriesStore();

  // Filter entries based on search
  const filteredEntries = searchQuery 
    ? searchEntries(searchQuery)
    : entries;

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Entries</h1>
        <Button onClick={() => setShowRecorder(true)}>
          📹 New Entry
        </Button>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search entries..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No entries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <strong className="text-sm">
                    {format(new Date(entry.recordedAt), 'PPp')}
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

      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

export default Entries;