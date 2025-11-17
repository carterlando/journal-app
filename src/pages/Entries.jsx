import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import ReelViewer from '../components/ReelViewer';
import { Input } from '@/components/ui/input';
import { Search, Play, Trash2 } from 'lucide-react';

/**
 * Entries Page - Grid view only
 * Shows thumbnails with text overlays
 * Videos only play in reel viewer
 */
function Entries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showReel, setShowReel] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);
  
  const { entries, deleteEntry, searchEntries } = useEntriesStore();

  const filteredEntries = searchQuery ? searchEntries(searchQuery) : entries;

  // Open reel viewer starting at specific entry
  const openReel = (index) => {
    setReelStartIndex(index);
    setShowReel(true);
  };

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">All Entries</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-foreground">All Entries</h1>
        <p className="text-muted-foreground">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      {/* Search */}
      <div className="px-4 md:px-0 py-4 md:pb-6 bg-card md:bg-transparent border-b md:border-0 border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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

      {/* Grid View - 2 columns on all screens */}
      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:gap-4 p-4 md:p-0">
          {filteredEntries.map((entry, index) => (
            <div
              key={entry.id}
              onClick={() => openReel(index)}
              className="relative aspect-[4/3] bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg overflow-hidden cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="absolute inset-0">
                {entry.thumbnailUrl ? (
                  <img 
                    src={entry.thumbnailUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-600/30 to-purple-600/30" />
                )}
              </div>

              {/* Play Icon - Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <Play className="w-6 h-6 md:w-7 md:h-7 text-white ml-0.5" />
                </div>
              </div>

              {/* Gradient Overlay - Top and Bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

              {/* Top Info - Date and Time */}
              <div className="absolute top-0 left-0 right-0 p-3">
                <p className="text-white text-xs md:text-sm font-semibold drop-shadow-lg">
                  {new Date(entry.recordedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-white/80 text-xs drop-shadow-lg">
                  {new Date(entry.recordedAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </p>
              </div>

              {/* Bottom Info - Duration and Delete */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                {/* Duration */}
                <div className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                  <p className="text-white text-xs font-medium">
                    {formatDuration(entry.duration)}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this entry?')) deleteEntry(entry.id);
                  }}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-red-500/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Tags - Optional, if entry has tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="absolute top-12 left-3 flex flex-wrap gap-1">
                  {entry.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reel Viewer - Videos only play here */}
      {showReel && (
        <ReelViewer
          entries={filteredEntries}
          initialIndex={reelStartIndex}
          onClose={() => setShowReel(false)}
        />
      )}
    </>
  );
}

export default Entries;