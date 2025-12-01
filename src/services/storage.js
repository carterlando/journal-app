/**
 * IndexedDB Storage Service
 * 
 * Handles persistent storage for:
 * - Video blobs (temporary, during recording)
 * - Upload queue items (reliable upload with retry)
 * 
 * Why IndexedDB:
 * - Can store large binary data (videos)
 * - Persists across browser sessions
 * - Survives page refreshes and crashes
 * - localStorage can't handle large blobs
 */

const DB_NAME = 'VideoJournalDB';
const DB_VERSION = 2; // Incremented for new upload queue store
const VIDEO_STORE = 'videos';
const QUEUE_STORE = 'uploadQueue';

class StorageService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB connection
   * Creates object stores if they don't exist
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      // Called when DB is first created or version changes
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create video store if not exists
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
          console.log('Created object store:', VIDEO_STORE);
        }

        // Create upload queue store if not exists
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          console.log('Created object store:', QUEUE_STORE);
        }
      };
    });
  }

  // ==================== VIDEO BLOB STORAGE ====================
  // For temporary storage during recording (not currently used, but available)

  async saveVideo(id, blob) {
    const transaction = this.db.transaction([VIDEO_STORE], 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id, blob, timestamp: Date.now() });
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getVideo(id) {
    const transaction = this.db.transaction([VIDEO_STORE], 'readonly');
    const store = transaction.objectStore(VIDEO_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(id) {
    const transaction = this.db.transaction([VIDEO_STORE], 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== UPLOAD QUEUE STORAGE ====================
  // For reliable upload with retry logic

  /**
   * Save/update an upload queue item
   * Item structure:
   * {
   *   id: string,
   *   entry: object (metadata),
   *   videoBlob: Blob,
   *   thumbnailBlob: Blob | null,
   *   retries: number,
   *   createdAt: timestamp,
   *   status: 'pending' | 'uploading' | 'completed' | 'failed',
   *   error: string | null
   * }
   */
  async saveUploadQueueItem(id, item) {
    const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single upload queue item by ID
   */
  async getUploadQueueItem(id) {
    const transaction = this.db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all upload queue items
   * Used on app startup to resume pending uploads
   */
  async getAllUploadQueueItems() {
    const transaction = this.db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an upload queue item
   * Called after successful upload or manual deletion
   */
  async deleteUploadQueueItem(id) {
    const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all upload queue items
   * Use with caution - only for debugging
   */
  async clearUploadQueue() {
    const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storage = new StorageService();