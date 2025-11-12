import { useState, useRef, useEffect } from 'react';
import { platform } from '../adapters';
import useEntriesStore from '../stores/entries';
import useSettingsStore from '../stores/settings';

/**
 * VideoRecorder Component
 * 
 * Handles video/audio recording functionality.
 * Uses the platform adapter so it works on web and will work on mobile.
 * 
 * Features:
 * - Camera preview
 * - Start/stop recording
 * - Countdown timer
 * - Preview recorded video before saving
 * - Respects user settings (quality, duration, audio-only mode)
 */
function VideoRecorder({ onClose }) {
  // ==================== STATE ====================
  
  const [stream, setStream] = useState(null); // Camera stream
  const [recording, setRecording] = useState(false); // Currently recording?
  const [recordedBlob, setRecordedBlob] = useState(null); // Recorded video data
  const [recordedUrl, setRecordedUrl] = useState(null); // URL for playback
  const [duration, setDuration] = useState(0); // Recording duration in seconds
  const [error, setError] = useState(null); // Error message
  const [previewing, setPreviewing] = useState(false); // Showing recorded video?

  // ==================== REFS ====================
  // Why: Refs let us access DOM elements and values without causing re-renders
  
  const videoRef = useRef(null); // Live camera preview element
  const mediaRecorderRef = useRef(null); // MediaRecorder instance
  const chunksRef = useRef([]); // Stores video data chunks during recording
  const timerRef = useRef(null); // Interval for duration counter

  // ==================== STORE DATA ====================
  
  const { addEntry } = useEntriesStore();
  const { maxVideoDuration, audioOnly } = useSettingsStore();

  // ==================== INITIALIZE CAMERA ====================
  
  /**
   * Request camera/microphone access when component mounts
   * Why: Need permissions before we can record
   */
  useEffect(() => {
    initializeCamera();
    
    // Cleanup: Stop camera when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Initialize camera and microphone
   * Requests user permission and starts preview
   */
  const initializeCamera = async () => {
    try {
      // Request camera and microphone access from browser
      // Why: Need explicit user permission to access camera/mic
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: !audioOnly ? { facingMode: 'user' } : false, // Front camera
        audio: true, // Always capture audio
      });

      setStream(mediaStream);
      
      // Show live preview in video element
      if (videoRef.current && !audioOnly) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera/microphone. Please check permissions.');
    }
  };

  // ==================== RECORDING CONTROLS ====================

  /**
   * Start recording
   * Creates MediaRecorder and begins capturing video/audio
   */
  const startRecording = () => {
    if (!stream) {
      setError('Camera not ready');
      return;
    }

    try {
      // Clear any previous recording data
      chunksRef.current = [];
      
      // Create MediaRecorder to capture the stream
      // Why: MediaRecorder API records video/audio from the camera stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus', // WebM format (widely supported)
      });

      // Event: When data is available, store it
      // Why: Recording happens in chunks for efficiency
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Event: When recording stops, create the final video file
      mediaRecorder.onstop = () => {
        // Combine all chunks into a single Blob (file)
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        // Create URL for preview playback
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        // Show preview screen
        setPreviewing(true);
      };

      // Start recording
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setDuration(0);
      setError(null);

      // Start duration counter
      // Why: Show user how long they've been recording
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxVideoDuration) {
            stopRecording();
          }
          
          return newDuration;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Could not start recording');
    }
  };

  /**
   * Stop recording
   * Stops MediaRecorder and duration counter
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      // Stop duration counter
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  /**
   * Save the recorded video as a journal entry
   * Stores video blob in IndexedDB for persistence
   */
  const saveRecording = async () => {
    if (!recordedBlob) return;

    try {
      // Create unique ID for this entry
      const entryId = Date.now().toString();
      
      // Import storage service
      const { storage } = await import('../services/storage');
      
      // Initialize storage if not already done
      if (!storage.db) {
        await storage.init();
      }
      
      // Save video blob to IndexedDB
      await storage.saveVideo(entryId, recordedBlob);
      
      console.log('Video saved to IndexedDB:', entryId);

      // Create journal entry object
      const entry = {
        id: entryId,
        createdAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        type: audioOnly ? 'audio' : 'video',
        duration: duration,
        mediaUrl: entryId, // Store ID instead of blob URL
        thumbnailUrl: null,
        transcription: '',
        tags: [],
      };

      // Add to store (saves metadata to localStorage)
      await addEntry(entry);

      // Close recorder
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setError('Could not save recording: ' + err.message);
    }
  };

  /**
   * Discard recording and start over
   */
  const discardRecording = () => {
    // Clean up blob URL to prevent memory leak
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    
    setRecordedBlob(null);
    setRecordedUrl(null);
    setPreviewing(false);
    setDuration(0);
  };

  // ==================== FORMAT HELPERS ====================

  /**
   * Format seconds as MM:SS
   * Why: Display human-readable time
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== RENDER ====================

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {previewing ? 'Preview Recording' : 'Record Journal Entry'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Preview Mode: Show recorded video */}
        {previewing ? (
          <div style={styles.content}>
            <video
              src={recordedUrl}
              controls
              style={styles.video}
              autoPlay
            />
            
            <div style={styles.previewInfo}>
              <p>Duration: {formatTime(duration)}</p>
            </div>

            <div style={styles.controls}>
              <button onClick={discardRecording} style={styles.secondaryButton}>
                Discard & Re-record
              </button>
              <button onClick={saveRecording} style={styles.primaryButton}>
                Save Entry
              </button>
            </div>
          </div>
        ) : (
          /* Recording Mode: Show live camera and controls */
          <div style={styles.content}>
            {!audioOnly && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={styles.video}
              />
            )}
            
            {audioOnly && (
              <div style={styles.audioPlaceholder}>
                <div style={styles.audioIcon}>🎤</div>
                <p>Audio-only mode</p>
              </div>
            )}

            {/* Duration Display */}
            <div style={styles.durationDisplay}>
              {recording && (
                <>
                  <span style={styles.recordingDot}>●</span>
                  {formatTime(duration)} / {formatTime(maxVideoDuration)}
                </>
              )}
            </div>

            {/* Recording Controls */}
            <div style={styles.controls}>
              {!recording ? (
                <button onClick={startRecording} style={styles.recordButton}>
                  Start Recording
                </button>
              ) : (
                <button onClick={stopRecording} style={styles.stopButton}>
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STYLES ====================

// Styles object
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid hsl(var(--border))',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'hsl(var(--card))',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: 'hsl(var(--foreground))',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'hsl(var(--muted-foreground))',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  error: {
    padding: '12px 20px',
    backgroundColor: 'hsl(var(--destructive))',
    color: 'hsl(var(--destructive-foreground))',
    margin: '20px',
    borderRadius: '8px',
  },
  content: {
    padding: '20px',
  },
  video: {
    width: '100%',
    borderRadius: '8px',
    backgroundColor: '#000',
  },
  audioPlaceholder: {
    width: '100%',
    aspectRatio: '16/9',
    backgroundColor: 'hsl(var(--muted))',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'hsl(var(--muted-foreground))',
  },
  audioIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  durationDisplay: {
    marginTop: '16px',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    color: 'hsl(var(--foreground))',
  },
  recordingDot: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    backgroundColor: '#ef4444',
    borderRadius: '50%',
    marginRight: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--secondary-foreground))',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  previewInfo: {
    marginTop: '16px',
    textAlign: 'center',
    color: 'hsl(var(--muted-foreground))',
  },
};

export default VideoRecorder;