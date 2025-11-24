import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, Settings, Check } from 'lucide-react';
import useEntriesStore from '../stores/entries';
import useAuthStore from '../stores/auth';
import AuthModal from '../components/AuthModal';
import ReelViewer from '../components/ReelViewer';
import { uploadVideo, generateThumbnail } from '../services/r2';
import { findMemoryEntry } from '../utils/memorySearch';
import { useVideoLoop } from '../hooks/useVideoLoop';
import { formatTime } from '../utils/dateHelpers';

/**
 * Home Page Component - Instagram Stories Style
 * 
 * Full-screen camera interface with:
 * - Live camera preview (mirrored)
 * - "Remember this day" memory video (top right)
 * - Recording timer with progress (top left)
 * - Record button with circular progress bar (center bottom)
 * - Navigation icons (calendar left, settings right)
 * - Max recording duration: 5 minutes (300 seconds)
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

  // Use custom hook for memory video loop (3 seconds)
  useVideoLoop(memoryVideoRef, memoryEntry?.mediaUrl, 3);

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
        
        // FIXED: Preserve finalDuration before clearing chunks
        const duration = chunksRef.current.finalDuration;
        chunksRef.current = [];
        chunksRef.current.finalDuration = duration;
        
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
      // CRITICAL: Store duration in chunksRef before stopping
      chunksRef.current.finalDuration = recordingTime;
      
      console.log('Stopping recording. Duration:', recordingTime);
      
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
      
      // Get duration from chunksRef (stored during stopRecording)
      const duration = chunksRef.current.finalDuration || 0;
      
      console.log('Saving entry. Duration:', duration);
      
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
        duration: duration,
        fileSize: blob.size,
        transcription: '',
        tags: [],
        type: 'video',
        storageType: 'cloud',
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      console.log('Entry object being saved:', entry);

      await addEntry(entry);
      
      setSaving(false);
      setSaved(true);
      
      setTimeout(() => {
        setSaved(false);
      }, 2000);
      
      setRecordingTime(0);
      
      // Clear the stored duration
      chunksRef.current.finalDuration = 0;
      
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
                
                {/* Date Label - Bottom of frame */}
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

        {/* Recording Timer - TOP LEFT with current/max time */}
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

        {/* Bottom Navigation - Centered horizontally */}
        <div className="absolute bottom-0 left-0 right-0 pb-8" style={{ zIndex: 20 }}>
          <div className="flex items-center justify-center gap-16 px-6">
            {/* Calendar Icon */}
            <Link
              to="/calendar"
              className="w-12 h-12 flex items-center justify-center hover:bg-black/20 rounded-full transition-colors"
            >
              <Calendar className="w-7 h-7 text-white drop-shadow-lg" />
            </Link>

            {/* Record Button with progress bar */}
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
              
              {/* Button inner shape - smooth transition: white circle → red square */}
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

            {/* Settings Icon */}
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