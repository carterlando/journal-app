import { useEffect } from 'react';

/**
 * Custom hook to loop a video every N seconds
 * @param {RefObject} videoRef - React ref to video element
 * @param {string} videoUrl - Video URL
 * @param {number} loopDuration - Loop duration in seconds (default 3)
 */
export const useVideoLoop = (videoRef, videoUrl, loopDuration = 3) => {
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      video.currentTime = 0;
      video.play().catch(err => console.error('Video play error:', err));
    };
    
    const handleTimeUpdate = () => {
      if (video.currentTime >= loopDuration) {
        video.currentTime = 0;
      }
    };
    
    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(err => console.error('Video play error:', err));
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    // Initial play if already loaded
    if (video.readyState >= 2) {
      video.currentTime = 0;
      video.play().catch(err => console.error('Video play error:', err));
    }
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoRef, videoUrl, loopDuration]);
};