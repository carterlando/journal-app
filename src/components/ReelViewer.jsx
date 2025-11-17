import { useState, useRef, useEffect } from 'react';
import { X, Heart, Volume2, VolumeX, Play } from 'lucide-react';
import { format } from 'date-fns';

/**
 * ReelViewer Component
 * 
 * Instagram/TikTok style vertical video viewer
 * Swipe up/down to navigate between entries
 * Removed share button, removed transcription display
 */
function ReelViewer({ entries, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  const currentEntry = entries[currentIndex];

  // Auto-play when entry changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  }, [currentIndex]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [currentIndex]);

  // Hide swipe hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Swipe navigation
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    // Swipe up - next video
    if (diff > 50 && currentIndex < entries.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    }
    
    // Swipe down - previous video
    if (diff < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setProgress(0);
      }
      if (e.key === 'ArrowDown' && currentIndex < entries.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setProgress(0);
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, entries.length]);

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-50">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        src={currentEntry.mediaUrl}
        className="w-full h-full object-cover"
        autoPlay
        loop
        playsInline
        muted={muted}
        onClick={togglePlay}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform hover:bg-white/20"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="text-white">
            <p className="font-semibold text-base">
              {format(new Date(currentEntry.recordedAt), 'MMMM d, yyyy')}
            </p>
            <p className="text-sm text-white/70">
              {format(new Date(currentEntry.recordedAt), 'h:mm a')}
            </p>
          </div>
        </div>

        {/* Volume Control */}
        <button
          onClick={toggleMute}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform hover:bg-white/20"
        >
          {muted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Center Play/Pause Indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Right Controls - Only Like Button */}
      <div className="absolute bottom-32 right-4 flex flex-col gap-4 z-40">
        {/* Like Button */}
        <button
          onClick={() => setLiked(!liked)}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center active:scale-95 transition-all hover:bg-white/20"
        >
          <Heart 
            className={`w-6 h-6 transition-all ${
              liked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-40">
        {/* Tags - Only if entry has tags */}
        {currentEntry.tags && currentEntry.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {currentEntry.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Navigation Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {entries.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-white' 
                  : 'w-1 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Entry Counter */}
        <p className="text-center text-white/50 text-xs">
          {currentIndex + 1} / {entries.length}
        </p>
      </div>

      {/* Swipe Hint */}
      {showSwipeHint && entries.length > 1 && (
        <div className="absolute bottom-48 left-0 right-0 flex justify-center pointer-events-none animate-fade-in">
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-white/70 text-xs">
              {currentIndex < entries.length - 1 ? 'Swipe up for next' : 'Swipe down for previous'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReelViewer;