import { useState, useRef, useEffect } from 'react';
import { X, Volume2, VolumeX, Play } from 'lucide-react';
import { format } from 'date-fns';

/**
 * ReelViewer Component
 * 
 * Full-screen video player
 * - Video fills height, crops sides if needed
 * - Horizontal swipe to navigate between entries (days)
 * - Progress bar at top
 * - Close button and date/time on top left
 * - Duration on top right
 * - Mute/unmute on bottom right
 */
function ReelViewer({ entries, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const currentEntry = entries[currentIndex];

  // Lock body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Auto-play when entry changes and reset state
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setDuration(currentEntry.duration || 0);
    
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  }, [currentIndex, currentEntry.duration]);

  // Update progress bar and time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const videoDuration = video.duration;
      if (videoDuration && isFinite(videoDuration) && videoDuration > 0) {
        const currentProgress = (video.currentTime / videoDuration) * 100;
        setProgress(currentProgress);
        setCurrentTime(video.currentTime);
        setDuration(videoDuration);
      } else if (currentEntry.duration) {
        const currentProgress = (video.currentTime / currentEntry.duration) * 100;
        setProgress(currentProgress);
        setCurrentTime(video.currentTime);
        setDuration(currentEntry.duration);
      }
    };

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      if (videoDuration && isFinite(videoDuration) && videoDuration > 0) {
        setDuration(videoDuration);
      } else if (currentEntry.duration) {
        setDuration(currentEntry.duration);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentIndex, currentEntry.duration]);

  // Swipe navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Determine if swipe is more horizontal or vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 50 && currentIndex > 0) {
        // Swipe left - previous entry
        setCurrentIndex(prev => prev - 1);
      } else if (diffX < -50 && currentIndex < entries.length - 1) {
        // Swipe right - next entry
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex < entries.length - 1) {
        setCurrentIndex(prev => prev + 1);
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

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 right-0 bottom-0 bg-black overflow-hidden"
      style={{ zIndex: 100 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video - 100% height, centered, crops sides */}
      <video
        ref={videoRef}
        src={currentEntry.mediaUrl}
        autoPlay
        loop
        playsInline
        muted={muted}
        onClick={togglePlay}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          height: '100%',
          width: 'auto',
          maxWidth: 'none',
        }}
      />

      {/* Progress Bar - Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-50">
        <div 
          className="h-full bg-white transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex items-center justify-between z-40">
        {/* Left: Close + Date/Time */}
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

        {/* Right: Duration */}
        <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
          <span className="text-white text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Center Play Button */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
            <Play className="w-6 h-6 text-black ml-0.5" fill="black" />
          </div>
        </div>
      )}

      {/* Bottom Right: Mute/Unmute */}
      <div className="absolute bottom-8 right-4 z-40">
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
    </div>
  );
}

export default ReelViewer;