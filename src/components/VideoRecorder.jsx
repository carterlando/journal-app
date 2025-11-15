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

  /**
   * Initialize camera and microphone
   */
  const initializeCamera = async () => {
    try {
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

      // Show camera preview
      if (videoRef.current && !audioOnly) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Could not access camera/microphone. Please check permissions.');
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        {!uploading && previewing && (
          <div style={styles.content}>
            <video
              src={recordedUrl}
              controls
              style={styles.video}
              autoPlay
            />
            
            <div style={styles.previewInfo}>
              <p>Duration: {formatTime(duration)}</p>
              {recordedBlob && <p>Size: {formatFileSize(recordedBlob.size)}</p>}
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
        {!uploading && !previewing && (
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
    backgroundColor: 'white',
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
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  primaryButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  error: {
    padding: '15px',
    margin: '20px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    fontSize: '14px',
  },
  progressContainer: {
    width: '100%',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: '#f0f0f0',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '16px',
    color: '#666',
  },
};

export default VideoRecorder;