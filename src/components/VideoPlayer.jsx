import { Play } from 'lucide-react';

/**
 * VideoPlayer Component
 * 
 * Displays video thumbnail with play overlay
 * No video loading until reel viewer opens
 * Used in Entries list/grid and Calendar
 */
function VideoPlayer({ videoId, className = '' }) {
  return (
    <div className={`relative bg-muted ${className}`}>
      {/* Thumbnail placeholder */}
      <div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
        <Play className="w-12 h-12 text-white/70" />
      </div>
      
      {/* Optional: Add actual thumbnail if you have thumbnailUrl */}
      {/* <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" /> */}
    </div>
  );
}

export default VideoPlayer;