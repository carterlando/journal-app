import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoPlayer from '../components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid, List } from 'lucide-react';

/**
 * Entries Page - All entries with search and view modes
 * No record button - recording only happens from calendar
 */
function Entries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { entries, deleteEntry, searchEntries } = useEntriesStore();

  const filteredEntries = searchQuery ? searchEntries(searchQuery) : entries;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">All Entries</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-foreground">All Entries</h1>
        <p className="text-muted-foreground">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      {/* Search and Controls */}
      <div className="p-4 md:p-0 md:mb-6 bg-card md:bg-transparent border-b md:border-0 border-border">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Toggle - Desktop only */}
          <div className="hidden md:flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {searchQuery ? 'No entries found' : 'No entries yet'}
          </h3>
          <p className="text-muted-foreground text-center">
            {searchQuery ? 'Try a different search term' : 'Record your first entry from the calendar'}
          </p>
        </div>
      )}

      {/* Mobile View - Always list style */}
      <div className="md:hidden space-y-0 p-4">
        {filteredEntries.map((entry) => (
          <div 
            key={entry.id}
            className="bg-card p-4 flex gap-3 border-b border-border"
          >
            {/* Thumbnail */}
            <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden">
              <VideoPlayer videoId={entry.mediaUrl} className="w-full h-full object-cover" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {new Date(entry.recordedAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {entry.transcription || 'No transcription'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                if (confirm('Delete?')) deleteEntry(entry.id);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Grid View */}
      {viewMode === 'grid' && filteredEntries.length > 0 && (
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <VideoPlayer videoId={entry.mediaUrl} className="w-full" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(entry.recordedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete?')) deleteEntry(entry.id);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    🗑️
                  </button>
                </div>
                {entry.transcription && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {entry.transcription}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop List View */}
      {viewMode === 'list' && filteredEntries.length > 0 && (
        <div className="hidden md:space-y-4 md:block">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
              <div className="w-48 flex-shrink-0">
                <VideoPlayer videoId={entry.mediaUrl} className="w-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(entry.recordedAt).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.recordedAt).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete?')) deleteEntry(entry.id);
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
                <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                  <span>{Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}</span>
                  <span>•</span>
                  <span>{entry.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default Entries;