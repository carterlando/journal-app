import { X, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEntriesStore from '../stores/entries';
import { useState } from 'react';
import ReelViewer from './ReelViewer';

/**
 * DayView Component
 * 
 * Shows all entries for a specific day in a grid
 * Matches Entries page style
 */
function DayView({ date, entries, onClose }) {
  const { deleteEntry } = useEntriesStore();
  const [showReel, setShowReel] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (entryId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(entryId);
      if (entries.length <= 1) {
        onClose();
      }
    }
  };

  const openReel = (index) => {
    setReelStartIndex(index);
    setShowReel(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="w-full max-w-4xl bg-[hsl(var(--card))] rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {formatDate(date)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Entries Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No entries for this day</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {entries.map((entry, index) => (
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

                    {/* Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all">
                        <Play className="w-7 h-7 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                    {/* Top Info */}
                    <div className="absolute top-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-semibold drop-shadow-lg">
                        {formatTime(entry.recordedAt)}
                      </p>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                      <div className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                        <p className="text-white text-xs font-medium">
                          {formatDuration(entry.duration)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-red-500/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reel Viewer */}
      {showReel && (
        <ReelViewer
          entries={entries}
          initialIndex={reelStartIndex}
          onClose={() => setShowReel(false)}
        />
      )}
    </>
  );
}

export default DayView;