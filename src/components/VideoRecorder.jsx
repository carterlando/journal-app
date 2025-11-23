import { useState, useRef, useEffect } from 'react';
import useEntriesStore from '../stores/entries';
import useSettingsStore from '../stores/settings';
import { uploadVideo, generateThumbnail } from '../services/r2';
import useAuthStore from '../stores/auth';

/**
 * VideoRecorder Component
 * 
 * Handles video/audio recording and upload to R2
 * Saves entry metadata to Supabase database
 */
function VideoRecorder({ onClose }) {
  // ==================== STATE ====================
  
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ==================== REFS ====================
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // ==================== STORE DATA ====================
  
  const { addEntry } = useEntriesStore();
  const { maxVideoDuration, audioOnly } = useSettingsStore();
  const { user } = useAuthStore();

  // ==================== INITIALIZE CAMERA ====================
  
  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, []);

  // Set video stream when it's ready
  useEffect(() => {
    if (stream && videoRef.current && !audioOnly && !recording && !previewing) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, audioOnly, recording, previewing]);

  /**
   * Initialize camera and microphone
   */
  const initializeCamera = async () => {
    try {
      setLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: !audioOnly ? { 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      setStream(mediaStream);
      setLoading(false);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Could not access camera/microphone. Please check permissions.');
      setLoading(false);
    }
  };

  // ==================== RECORDING CONTROLS ====================

  /**
   * Start recording
   */
  const startRecording = () => {
    if (!stream) {
      setError('No media stream available');
      return;
    }

    try {
      chunksRef.current = [];

      // Create MediaRecorder with appropriate codec
      const mimeType = audioOnly 
        ? 'audio/webm;codecs=opus'
        : 'video/webm;codecs=vp8,opus';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { 
          type: audioOnly ? 'audio/webm' : 'video/webm' 
        });
        setRecordedBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        setPreviewing(true);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxVideoDuration) {
            stopRecording();
            return maxVideoDuration;
          }
          
          return newDuration;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording start error:', err);
      setError('Failed to start recording');
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  /**
   * Save the recorded video
   * Uploads to R2 and saves metadata to Supabase
   */
  const saveRecording = async () => {
    if (!recordedBlob || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique entry ID
      const entryId = crypto.randomUUID();
      
      setUploadProgress(10);

      // Upload video to R2
      console.log('Uploading video to R2...');
      const videoUrl = await uploadVideo(recordedBlob, user.id, entryId);
      
      setUploadProgress(60);

      // Generate thumbnail (optional, can be null for audio)
      let thumbnailUrl = null;
      if (!audioOnly) {
        try {
          console.log('Generating thumbnail...');
          const thumbnailBlob = await generateThumbnail(recordedBlob);
          thumbnailUrl = await uploadVideo(thumbnailBlob, user.id, `${entryId}_thumb`);
        } catch (err) {
          console.error('Thumbnail generation failed:', err);
        }
      }
      
      setUploadProgress(80);

      // Create entry object
      const entry = {
        id: entryId,
        videoUrl: videoUrl,
        mediaUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        duration: duration,
        fileSize: recordedBlob.size,
        transcription: '',
        tags: [],
        type: audioOnly ? 'audio' : 'video',
        storageType: 'cloud',
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save to Supabase
      console.log('Saving entry to database...');
      await addEntry(entry);

      setUploadProgress(100);

      // Close recorder
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save recording: ${err.message}`);
      setUploading(false);
    }
  };

  /**
   * Discard recording and start over
   */
  const discardRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    
    setRecordedBlob(null);
    setRecordedUrl(null);
    setPreviewing(false);
    setDuration(0);
    setUploadProgress(0);
  };

  // ==================== FORMAT HELPERS ====================

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
            {uploading ? 'Uploading...' : previewing ? 'Preview Recording' : 'Record Journal Entry'}
          </h2>
          <button onClick={onClose} style={styles.closeButton} disabled={uploading}>✕</button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Loading Display */}
        {loading && !error && (
          <div style={styles.content}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Uploading Progress */}
        {uploading && (
          <div style={styles.content}>
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${uploadProgress}%`}}></div>
              </div>
              <p style={styles.progressText}>{uploadProgress}% - Uploading to cloud...</p>
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {!uploading && !loading && previewing && (
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
                Save to Cloud
              </button>
            </div>
          </div>
        )}

        {/* Recording Mode */}
        {!uploading && !loading && !previewing && (
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
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid hsl(var(--border))',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: '30px',
    height: '30px',
  },
  content: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    maxHeight: '400px',
    backgroundColor: '#000',
    borderRadius: '8px',
  },
  audioPlaceholder: {
    width: '100%',
    height: '300px',
    backgroundColor: 'hsl(var(--muted))',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIcon: {
    fontSize: '64px',
    marginBottom: '10px',
  },
  durationDisplay: {
    marginTop: '15px',
    fontSize: '18px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'hsl(var(--foreground))',
  },
  recordingDot: {
    color: '#ff0000',
    fontSize: '24px',
    animation: 'blink 1s infinite',
  },
  previewInfo: {
    marginTop: '15px',
    fontSize: '16px',
    textAlign: 'center',
    color: 'hsl(var(--foreground))',
  },
  controls: {
    marginTop: '20px',
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  recordButton: {
    flex: 1,
    padding: '15px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#ff0000',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  stopButton: {
    flex: 1,
    padding: '15px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: 'hsl(var(--foreground))',
    color: 'hsl(var(--background))',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  primaryButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--secondary-foreground))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  error: {
    padding: '15px',
    margin: '20px',
    backgroundColor: 'hsl(var(--destructive) / 0.1)',
    color: 'hsl(var(--destructive))',
    borderRadius: '8px',
    fontSize: '14px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '40px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid hsl(var(--muted))',
    borderTop: '4px solid hsl(var(--primary))',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: 'hsl(var(--muted-foreground))',
  },
  progressContainer: {
    width: '100%',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: 'hsl(var(--muted))',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'hsl(var(--primary))',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '16px',
    color: 'hsl(var(--muted-foreground))',
  },
};

export default VideoRecorder;