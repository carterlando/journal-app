import { useState } from 'react';
import useEntriesStore from '../stores/entries';
import VideoRecorder from '../components/VideoRecorder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Plus, Search, Trash2 } from 'lucide-react';

/**
 * Entries Page
 * 
 * Mobile: List view
 * Desktop: Grid view with cards
 */
function Entries() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { entries, deleteEntry, searchEntries } = useEntriesStore();

  const filteredEntries = searchQuery 
    ? searchEntries(searchQuery)
    : entries;

  return (
    <div className="pb-20 md:pb-0">
      
      {/* Header - Mobile */}
      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <h1 className="text-xl font-bold">All Entries</h1>
        <p className="text-sm text-gray-600">{entries.length} total</p>
      </div>

      {/* Header - Desktop */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold mb-2">All Entries</h1>
        <p className="text-gray-600">{entries.length} total entries</p>
      </div>

      {/* Search Bar */}
      <div className="p-4 md:p-0 md:mb-6 bg-white md:bg-transparent border-b md:border-0 border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Entries List/Grid */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] px-6 text-center">
          <p className="text-gray-500">
            {searchQuery ? 'No matching entries' : 'No entries yet'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: List View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white p-4 flex gap-3">
                
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {entry.mediaUrl && entry.type === 'video' ? (
                    <video 
                      src={entry.mediaUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎤
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    {format(new Date(entry.recordedAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-600 mb-2 truncate">
                    {entry.transcription || 'No transcription'}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
                    </Badge>
                  </div>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteEntry(entry.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            ))}
          </div>

          {/* Desktop: Grid View */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Video Thumbnail */}
                {entry.mediaUrl && entry.type === 'video' ? (
                  <video 
                    src={entry.mediaUrl}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl">
                    🎤
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium">
                      {format(new Date(entry.recordedAt), 'MMM d, yyyy')}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {entry.transcription || 'No transcription'}
                  </p>
                  
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {entry.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowRecorder(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showRecorder && (
        <VideoRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

export default Entries;