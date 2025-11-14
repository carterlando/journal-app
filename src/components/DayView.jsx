import { X, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEntriesStore from '../stores/entries';

/**
 * DayView Component
 * 
 * Shows all entries for a specific day
 * Allows playing videos and deleting entries
 */
function DayView({ date, entries, onClose }) {
  const { deleteEntry } = useEntriesStore();

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

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(entryId);
      // If no entries left, close the modal
      if (entries.length <= 1) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-6">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No entries for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-accent/50 rounded-lg p-4 border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Video Thumbnail or Audio Icon */}
                    <div className="w-32 h-24 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {entry.thumbnailUrl ? (
                        <img
                          src={entry.thumbnailUrl}
                          alt="Entry thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Play className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Entry Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {formatTime(entry.recordedAt)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.type === 'video' ? '📹' : '🎤'} {entry.type} • {formatDuration(entry.duration)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Transcription */}
                      {entry.transcription && (
                        <p className="text-sm text-foreground mt-3 line-clamp-2">
                          {entry.transcription}
                        </p>
                      )}

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Play Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          // TODO: Implement video player
                          alert('Video player will be implemented next!');
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DayView;