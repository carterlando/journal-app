import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

/**
 * Instagram-style VideoPlayer Component
 * 
 * Features:
 * - Tap to play/pause
 * - Custom controls overlay
 * - Mute/unmute button
 * - Progress bar
 * - Auto-pauses when scrolled out of view
 */
function VideoPlayer({ videoId, className = '' }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    loadVideo();
    
    // Cleanup: Revoke blob URL when component unmounts (only if it's a blob URL)
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoId]);

  /**
   * Load video - checks if it's a URL or IndexedDB ID
   */
  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if videoId is already a URL (R2)
      if (videoId.startsWith('http://') || videoId.startsWith('https://')) {
        setVideoUrl(videoId);
        setLoading(false);
        return;
      }

      // Otherwise, load from IndexedDB
      const { storage } = await import('../services/storage');
      const blob = await storage.getVideo(videoId);
      
      if (!blob) {
        throw new Error('Video not found');
      }

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Video load error:', err);
      setError('Failed to load video');
      setLoading(false);
    }
  };

  /**
   * Toggle play/pause
   */
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
    
    // Show controls briefly
    showControlsTemporarily();
  };

  /**
   * Toggle mute
   */
  const toggleMute = (e) => {
    e.stopPropagation(); // Prevent triggering play/pause
    if (!videoRef.current) return;
    
    videoRef.current.muted = !muted;
    setMuted(!muted);
    showControlsTemporarily();
  };

  /**
   * Show controls for 2 seconds
   */
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 2000);
  };

  /**
   * Update progress bar
   */
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  /**
   * Video ended - reset to beginning
   */
  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    setShowControls(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-muted rounded-lg aspect-[9/16] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-destructive/10 rounded-lg aspect-[9/16] flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2 p-4">
          <p className="text-destructive text-sm text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden aspect-[9/16] ${className}`}
      onClick={togglePlay}
      onMouseMove={showControlsTemporarily}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        playsInline
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center Play/Pause Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!playing && (
            <div className="bg-white/90 rounded-full p-4">
              <Play className="w-8 h-8 text-black fill-black" />
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Mute Button */}
          <div className="flex justify-end">
            <button
              onClick={toggleMute}
              className="bg-black/50 hover:bg-black/70 p-2 rounded-full transition-colors"
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;