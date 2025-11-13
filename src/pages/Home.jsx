import { useState } from 'react';
import Calendar from '../components/Calendar';
import VideoPlayer from '../components/VideoPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useEntriesStore from '../stores/entries';

/**
 * Home Page - Calendar view as main screen
 */
function Home() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const { deleteEntry } = useEntriesStore();

  const handleDayClick = (date, entries) => {
    setSelectedDate(date);
    setSelectedEntries(entries);
  };

  const clearSelection = () => {
    setSelectedDate(null);
    setSelectedEntries([]);
  };

  return (
    <div className="wrapper">
      {/* Page Header - Mobile */}
      <div className="md:hidden top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Your Journal</h1>
      </div>

      {/* Page Header - Desktop */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold text-foreground">Your Journal</h1>
        <p className="text-muted-foreground">Tap today to record, tap past days to view entries</p>
      </div>

      {/* Wrapper */}
      <div className="p-4">

        {/* Calendar */}
        <Calendar onDayClick={handleDayClick} />

        {/* Selected Day Entries */}
        {selectedDate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Close
              </Button>
            </div>

            {selectedEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No entries for this day</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {selectedEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-0">
                      {/* Video */}
                      {entry.type === 'video' && (
                        <VideoPlayer 
                          videoId={entry.mediaUrl}
                          className="w-full"
                        />
                      )}
                      
                      {/* Entry Info */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {new Date(entry.recordedAt).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit'
                            })}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('Delete this entry?')) {
                                deleteEntry(entry.id);
                                setSelectedEntries(prev => prev.filter(e => e.id !== entry.id));
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        {entry.transcription && (
                          <p className="text-sm text-muted-foreground">
                            {entry.transcription}
                          </p>
                        )}
                        
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}</span>
                          <span>•</span>
                          <span>{entry.type}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    <div className="md:hidden h-16"></div>

    </div>
    
  );
}

export default Home;