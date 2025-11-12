import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoRecorder from '../components/VideoRecorder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

function Home() {
  const [showRecorder, setShowRecorder] = useState(false);
  const { entries, deleteEntry } = useEntriesStore();

  return (
    <div className="pb-20 md:pb-0">
      
      <div className="md:hidden sticky top-0 bg-card border-b border-border z-10 px-4 py-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Video Journal
        </h1>
      </div>

      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Your Journal</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {entries.length === 0 ? 'Start capturing your moments' : `${entries.length} entries`}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <div className="text-6xl mb-4">📹</div>
          <h2 className="text-xl font-semibold mb-2 dark:text-white">No entries yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start capturing your moments by recording your first entry
          </p>
          <Button 
            size="lg"
            onClick={() => setShowRecorder(true)}
            className="rounded-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Record First Entry
          </Button>
        </div>
      ) : (
        <div className="md:space-y-4">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className="bg-card p-4 border-b md:border md:rounded-lg md:shadow-sm border-border"
            >
              
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    ME
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-gray-200">You</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(entry.recordedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </Button>
              </div>

              {entry.mediaUrl && entry.type === 'video' && (
                <video 
                  src={entry.mediaUrl} 
                  controls 
                  className="w-full rounded-lg mb-3"
                  playsInline
                />
              )}

              {entry.transcription && (
                <p className="text-sm mb-3 text-gray-800 dark:text-gray-200">
                  {entry.transcription}
                </p>
              )}

              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {entry.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <button
          onClick={() => setShowRecorder(true)}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

export default Home;