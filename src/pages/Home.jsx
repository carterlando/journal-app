import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Check } from 'lucide-react';
import useEntriesStore from '../stores/entries';
import useAuthStore from '../stores/auth';
import AuthModal from '../components/AuthModal';
import ReelViewer from '../components/ReelViewer';
import { uploadQueue } from '../services/uploadQueue';
import { generateThumbnail } from '../services/r2';
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
 * - Reliable upload with retry via upload queue
 * - Auto-stop and save at max duration
 * - Optimized for 720p30fps recording
 * - Auto-record when navigating with ?record=true
 * 
 * Recording functionality:
 * - Attaches to the static record button in Navigation.jsx via DOM manipulation
 * - Updates button appearance and progress ring during recording
 * - Saves to IndexedDB immediately, uploads with retry in background
 */
function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const { entries, loading } = useEntriesStore();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [autoRecordTriggered, setAutoRecordTriggered] = useState(false);
  
  const videoRef = useRef(null);
  const memoryVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Maximum recording duration in seconds (5 minutes)
  const MAX_DURATION = 300;

  /**
   * Initialize camera preview
   * Request user media with video and audio
   * Optimized for 720p30fps - best balance of quality and performance
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
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

  /**
   * Set video stream to video element
   */
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  /**
   * Auto-start recording when navigating with ?record=true
   * Waits for camera stream to be ready
   */
  useEffect(() => {
    const shouldAutoRecord = searchParams.get('record') === 'true';
    
    if (shouldAutoRecord && stream && !recording && !autoRecordTriggered && !saving) {
      // Clear the URL param
      setSearchParams({}, { replace: true });
      setAutoRecordTriggered(true);
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        startRecording();
      }, 300);
    }
  }, [searchParams, stream, recording, autoRecordTriggered, saving]);

  /**
   * Reset auto-record flag when leaving and coming back
   */
  useEffect(() => {
    return () => {
      setAutoRecordTriggered(false);
    };
  }, []);

  /**
   * Use custom hook for memory video loop (3 seconds)
   */
  useVideoLoop(memoryVideoRef, memoryEntry?.mediaUrl, 3);

  /**
   * Find memory entry using server-side search
   * Queries Supabase directly for better performance
   */
  useEffect(() => {
    if (!isAuthenticated || !user || memoryCalculated) {
      return;
    }

    const fetchMemory = async () => {
      const foundEntry = await findMemoryEntry(user.id);
      setMemoryEntry(foundEntry);
      setMemoryCalculated(true);
    };

    fetchMemory();
  }, [isAuthenticated, user, memoryCalculated]);

  /**
   * Attach record button functionality to Navigation's static button
   * Updates button appearance and progress during recording
   */
  useEffect(() => {
    const recordButton = document.getElementById('record-button');
    const recordButtonInner = document.getElementById('record-button-inner');
    const progressBg = document.getElementById('record-progress-bg');
    const progressFill = document.getElementById('record-progress-fill');

    if (!recordButton) return;

    // Attach click handler
    recordButton.onclick = handleRecordClick;

    // Update button disabled state
    recordButton.disabled = !stream || saving;

    // Update button appearance based on recording state
    if (recordButtonInner) {
      if (recording) {
        // Transform to red square
        recordButtonInner.style.width = '2rem';
        recordButtonInner.style.height = '2rem';
        recordButtonInner.style.borderRadius = '0.375rem';
        recordButtonInner.style.backgroundColor = '#dc2626';
      } else {
        // White circle
        recordButtonInner.style.width = '4rem';
        recordButtonInner.style.height = '4rem';
        recordButtonInner.style.borderRadius = '50%';
        recordButtonInner.style.backgroundColor = 'white';
      }
    }

    // Update progress ring
    if (progressBg) {
      progressBg.style.opacity = recording ? '0.3' : '1';
    }

    if (progressFill) {
      if (recording) {
        progressFill.style.display = 'block';
        const progress = (recordingTime / MAX_DURATION) * 100;
        const circumference = 2 * Math.PI * 36;
        progressFill.style.strokeDashoffset = `${circumference * (1 - progress / 100)}`;
      } else {
        progressFill.style.display = 'none';
        // Reset progress for next recording
        progressFill.style.strokeDashoffset = `${2 * Math.PI * 36}`;
      }
    }

    // Cleanup
    return () => {
      if (recordButton) {
        recordButton.onclick = null;
      }
    };
  }, [recording, stream, saving, recordingTime]);

  /**
   * Handle memory video click
   * Opens reel viewer with the memory entry
   */
  const handleMemoryClick = () => {
    if (memoryEntry) {
      setShowReel(true);
    }
  };

  /**
   * Start recording video
   * Sets up MediaRecorder and starts capturing chunks
   * Optimized bitrate for 720p30fps
   */
  const startRecording = () => {
    if (!stream || recording) return;

    try {
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 1500000, // 1.5Mbps - optimal for 720p
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Get duration that was stored during stopRecording
        const duration = chunksRef.current.finalDuration;
        chunksRef.current = [];
        chunksRef.current.finalDuration = duration;
        
        // Save to upload queue (with retry logic)
        saveRecording(blob);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setRecordingTime(0);

      // Start timer and auto-stop at MAX_DURATION
      // Start timer and auto-stop at MAX_DURATION
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= MAX_DURATION) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              // Store duration before stopping (same as manual stopRecording)
              chunksRef.current.finalDuration = MAX_DURATION;
              console.log('Auto-stop at max duration. Duration:', MAX_DURATION);
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
   * UI updates immediately, save happens in onstop
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      // Store duration before stopping
      chunksRef.current.finalDuration = recordingTime;
      
      console.log('Stopping recording. Duration:', recordingTime);
      
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  /**
   * Save recording to upload queue
   * Adds to IndexedDB and starts background upload with retry
   */
  const saveRecording = async (blob) => {
    if (!user) return;

    setSaving(true);
    setSaved(false);

    try {
      const entryId = crypto.randomUUID();
      const duration = chunksRef.current.finalDuration || 0;
      
      console.log('Saving recording to upload queue. Duration:', duration);
      
      // Generate thumbnail
      let thumbnailBlob = null;
      try {
        thumbnailBlob = await generateThumbnail(blob);
        console.log('✅ Thumbnail generated');
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
      
      // Create entry metadata
      const entry = {
        id: entryId,
        duration: duration,
        transcription: '',
        tags: [],
        type: 'video',
        recordedAt: new Date().toISOString(),
      };

      // Add to upload queue
      // This saves to IndexedDB and starts upload with retry logic
      await uploadQueue.addToQueue(entry, blob, thumbnailBlob);
      
      console.log('✅ Added to upload queue');
      
      setSaving(false);
      setSaved(true);
      
      // Hide "saved" message after 2 seconds
      setTimeout(() => {
        setSaved(false);
      }, 2000);
      
      setRecordingTime(0);
      chunksRef.current.finalDuration = 0;
      
    } catch (err) {
      console.error('Save error:', err);
      setSaving(false);
      alert('Failed to save recording. Please try again.');
    }
  };

  /**
   * Handle record button click
   * Toggles between start and stop recording
   */
  const handleRecordClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Show auth modal if not authenticated
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

        {/* Navigation is rendered globally in App.jsx */}
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