import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, Settings, Check } from 'lucide-react';
import useEntriesStore from '../stores/entries';
import useAuthStore from '../stores/auth';
import AuthModal from '../components/AuthModal';
import ReelViewer from '../components/ReelViewer';
import { uploadVideo, generateThumbnail } from '../services/r2';

/**
 * Home Page Component - Instagram Stories Style
 * 
 * CHANGES:
 * - Record button border is WHITE in both light and dark themes
 * - Recording timer moved to top left (was top right)
 * - Recording timer shows current/max time (e.g., 1:05/5:00)
 * - Record button border fills RED as progress bar during recording (fills inside the border)
 * - Memory video moved to top right (was top left)
 * - Memory date moved to bottom of frame (was top)
 * - Bottom navigation icons are horizontally centered
 * - Max recording duration: 5 minutes (300 seconds)
 * - Smooth single transition: white circle → red square (both size AND shape change simultaneously)
 * - Async save to prevent frame drops
 * - Auto-stop and save at max duration
 */
function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const { entries, loading, addEntry } = useEntriesStore();
  const [memoryEntry, setMemoryEntry] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReel, setShowReel] = useState(false);
  const [memoryCalculated, setMemoryCalculated] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const videoRef = useRef(null);
  const memoryVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Maximum recording duration in seconds (5 minutes)
  const MAX_DURATION = 300;

  // Initialize camera preview
  useEffect(() => {
    if (!isAuthenticated) return;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: true
        });
        setStream(mediaStream);
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError(true);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAuthenticated]);

  // Set video stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Loop memory video every 3 seconds
  useEffect(() => {
    if (memoryVideoRef.current && memoryEntry?.mediaUrl) {
      const video = memoryVideoRef.current;
      
      const handleLoadedMetadata = () => {
        video.currentTime = 0;
        video.play().catch(err => console.error('Video play error:', err));
      };
      
      const handleTimeUpdate = () => {
        if (video.currentTime >= 3) {
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
      
      if (video.readyState >= 2) {
        video.currentTime = 0;
        video.play().catch(err => console.error('Video play error:', err));
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [memoryEntry]);

  // Find memory entry using cascading search
  useEffect(() => {
    if (!isAuthenticated || loading || entries.length === 0 || memoryCalculated) {
      return;
    }

    const today = new Date();
    const foundEntry = findMemoryEntry(entries, today);
    setMemoryEntry(foundEntry);
    setMemoryCalculated(true);
  }, [isAuthenticated, entries, loading, memoryCalculated]);

  /**
   * Cascading search algorithm:
   * 1. Exact day match (same day/month, earlier year)
   * 2. ±7 days match (same week range, earlier year)
   * 3. Same month match (earlier year)
   * 4. Same year match (earlier year)
   * 5. Random past entry
   */
  const findMemoryEntry = (entries, referenceDate) => {
    if (entries.length === 0) return null;

    const todayMidnight = new Date(referenceDate);
    todayMidnight.setHours(0, 0, 0, 0);

    const pastEntries = entries.filter(entry => {
      const entryDate = new Date(entry.recordedAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate < todayMidnight;
    });

    if (pastEntries.length === 0) return null;

    for (let monthsBack = 0; monthsBack < 120; monthsBack++) {
      const targetDate = new Date(referenceDate);
      targetDate.setMonth(targetDate.getMonth() - monthsBack);

      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      const exactDayMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();
        const entryMonth = entryDate.getMonth() + 1;
        const entryDay = entryDate.getDate();

        return entryYear < targetYear &&
               entryMonth === targetMonth &&
               entryDay === targetDay;
      });

      if (exactDayMatches.length > 0) {
        return getRandomEntry(exactDayMatches);
      }

      const weekRangeMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();
        
        if (entryYear >= targetYear) return false;

        const targetDateInEntryYear = new Date(entryYear, targetMonth - 1, targetDay);
        const dayDiff = Math.abs(
          Math.floor((entryDate.getTime() - targetDateInEntryYear.getTime()) / (1000 * 60 * 60 * 24))
        );

        return dayDiff <= 7;
      });

      if (weekRangeMatches.length > 0) {
        return getClosestEntry(weekRangeMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
      }

      const sameMonthMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();
        const entryMonth = entryDate.getMonth() + 1;

        return entryYear < targetYear &&
               entryMonth === targetMonth;
      });

      if (sameMonthMatches.length > 0) {
        return getClosestEntry(sameMonthMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
      }

      const sameYearMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recordedAt);
        const entryYear = entryDate.getFullYear();

        return entryYear < targetYear;
      });

      if (sameYearMatches.length > 0) {
        return getClosestEntry(sameYearMatches, new Date(targetYear - 1, targetMonth - 1, targetDay));
      }
    }

    return getRandomEntry(pastEntries);
  };

  const getRandomEntry = (entries) => {
    const randomIndex = Math.floor(Math.random() * entries.length);
    return entries[randomIndex];
  };

  const getClosestEntry = (entries, targetDate) => {
    return entries.reduce((closest, entry) => {
      const entryDate = new Date(entry.recordedAt);
      const closestDate = new Date(closest.recordedAt);
      
      const entryDiff = Math.abs(entryDate.getTime() - targetDate.getTime());
      const closestDiff = Math.abs(closestDate.getTime() - targetDate.getTime());
      
      return entryDiff < closestDiff ? entry : closest;
    });
  };

  const handleMemoryClick = () => {
    if (memoryEntry) {
      setShowReel(true);
    }
  };

  /**
   * Start recording video
   */
  const startRecording = () => {
    if (!stream || recording) return;

    try {
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        // Save asynchronously to prevent UI blocking
        saveRecording(blob);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setRecordingTime(0);

      // Start timer and auto-stop at MAX_DURATION
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= MAX_DURATION) {
            // Stop recording immediately, save will happen in onstop
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
              setRecording(false);
              clearInterval(timerRef.current);
            }
            return MAX_DURATION;
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording start error:', err);
      alert('Failed to start recording');
    }
  };

  /**
   * Stop recording video
   * UI updates immediately, save happens asynchronously
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      // Stop recording and update UI immediately
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Save will happen in mediaRecorder.onstop
    }
  };

  /**
   * Save recording to Cloudflare R2 and Supabase
   * Runs asynchronously to prevent blocking UI
   */
  const saveRecording = async (blob) => {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      const entryId = crypto.randomUUID();
      
      const videoUrl = await uploadVideo(blob, user.id, entryId);
      
      let thumbnailUrl = null;
      try {
        const thumbnailBlob = await generateThumbnail(blob);
        thumbnailUrl = await uploadVideo(thumbnailBlob, user.id, `${entryId}_thumb`);
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
      
      const entry = {
        id: entryId,
        videoUrl: videoUrl,
        mediaUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        duration: recordingTime,
        fileSize: blob.size,
        transcription: '',
        tags: [],
        type: 'video',
        storageType: 'cloud',
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addEntry(entry);
      
      setSaving(false);
      setSaved(true);
      
      setTimeout(() => {
        setSaved(false);
      }, 2000);
      
      setRecordingTime(0);
      
    } catch (err) {
      console.error('Save error:', err);
      setSaving(false);
      alert('Failed to save recording');
    }
  };

  const handleRecordClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calculate recording progress percentage (0-100)
   */
  const getRecordingProgress = () => {
    return (recordingTime / MAX_DURATION) * 100;
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white px-8">
          <h1 className="text-4xl font-bold mb-4">Story Time</h1>
          <p className="text-xl mb-8 text-zinc-400">Sign in to start recording</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 rounded-full text-white font-semibold transition-colors"
          >
            Get Started
          </button>
        </div>

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Full-screen Camera Preview */}
      <div className="fixed inset-0 bg-black" style={{ zIndex: 0 }}>
        {/* Video Preview - Mirrored */}
        {!cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              transform: 'scaleX(-1)'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="text-center text-white px-8">
              <Camera className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">Camera access denied</p>
            </div>
          </div>
        )}

        {/* Remember this day - Video Loop (TOP RIGHT) */}
        {memoryEntry && !recording && (
          <div
            onClick={handleMemoryClick}
            className="absolute top-4 right-4 w-24 cursor-pointer group"
            style={{ zIndex: 30 }}
          >
            <div className="relative">
              {/* Video with 3-second loop */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border-1 border-white/80 group-hover:border-white/100 transition-colors shadow-lg relative">
                {memoryEntry.mediaUrl ? (
                  <video
                    ref={memoryVideoRef}
                    src={memoryEntry.mediaUrl}
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                  />
                ) : memoryEntry.thumbnailUrl ? (
                  <img
                    src={memoryEntry.thumbnailUrl}
                    alt="Memory"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <Camera className="w-6 h-6 text-white/50" />
                  </div>
                )}
                
                {/* Date Label - MOVED TO BOTTOM */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <p className="text-[11px] text-white font-semibold drop-shadow-lg text-center px-1.5 py-0.5">
                    {new Date(memoryEntry.recordedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Timer - TOP LEFT with MAX DURATION (5 minutes) */}
        {recording && (
          <div className="absolute top-4 left-4" style={{ zIndex: 30 }}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white font-mono font-semibold text-sm">
                {formatTime(recordingTime)}/{formatTime(MAX_DURATION)}
              </span>
            </div>
          </div>
        )}

        {/* Saving/Saved Feedback */}
        {(saving || saved) && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2" style={{ zIndex: 30 }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-full border border-white/20">
              {saving && (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white font-semibold">Saving...</span>
                </>
              )}
              {saved && (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">Saved!</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation - CENTERED HORIZONTALLY */}
        <div className="absolute bottom-0 left-0 right-0 pb-8" style={{ zIndex: 20 }}>
          <div className="flex items-center justify-center gap-16 px-6">
            {/* Calendar Icon - Bottom Left */}
            <Link
              to="/calendar"
              className="w-12 h-12 flex items-center justify-center hover:bg-black/20 rounded-full transition-colors"
            >
              <Calendar className="w-7 h-7 text-white drop-shadow-lg" />
            </Link>

            {/* Record Button - Center with RED PROGRESS BAR filling the WHITE BORDER */}
            <button
              onClick={handleRecordClick}
              className="relative"
              disabled={!stream || saving}
            >
              {/* Progress ring that fills the border (RED) */}
              <svg
                className="absolute top-0 left-0 w-20 h-20 -rotate-90"
                style={{ zIndex: 1 }}
              >
                {/* Background white border circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  opacity={recording ? "0.3" : "1"}
                  className="transition-opacity duration-500 ease-in-out"
                />
                {/* Red progress circle (only visible when recording) */}
                {recording && (
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#dc2626"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - getRecordingProgress() / 100)}`}
                    className="transition-all duration-200 ease-linear"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              
              {/* Button inner shape - SINGLE SMOOTH TRANSITION: white circle → red square */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <div 
                  style={{
                    width: recording ? '2rem' : '4rem',
                    height: recording ? '2rem' : '4rem',
                    borderRadius: recording ? '0.375rem' : '50%',
                    backgroundColor: recording ? '#dc2626' : 'white',
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
              </div>
            </button>

            {/* Settings Icon - Bottom Right */}
            <Link
              to="/settings"
              className="w-12 h-12 flex items-center justify-center hover:bg-black/20 rounded-full transition-colors"
            >
              <Settings className="w-7 h-7 text-white drop-shadow-lg" />
            </Link>
          </div>
        </div>
      </div>

      {/* Reel Viewer Modal */}
      {showReel && memoryEntry && (
        <ReelViewer
          entries={entries}
          initialIndex={entries.findIndex(e => e.id === memoryEntry.id)}
          onClose={() => setShowReel(false)}
        />
      )}
    </>
  );
}

export default Home;