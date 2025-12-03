import { storage } from './storage';
import { uploadVideo, generateThumbnail } from './r2';
import { supabase } from './supabase';
import useEntriesStore from '../stores/entries';

/**
 * Upload Queue Service
 * 
 * Handles reliable video uploads with retry logic
 * - Stores blobs in IndexedDB during upload
 * - Retries failed uploads with exponential backoff
 * - Processes queue on app startup
 * - Never loses recordings
 * - Updates entries store after successful upload for immediate UI sync
 * 
 * Upload states:
 * - pending: Waiting to upload or retry
 * - uploading: Currently uploading
 * - completed: Successfully uploaded (will be removed from queue)
 * - failed: Max retries reached (needs manual retry)
 */

class UploadQueue {
  constructor() {
    this.uploading = new Set(); // Track in-progress uploads to prevent duplicates
    this.maxRetries = 5;
    this.baseDelay = 2000; // 2 seconds base delay for exponential backoff
    this.listeners = new Set(); // For UI updates
  }

  /**
   * Add recording to upload queue
   * Saves blob to IndexedDB and starts upload immediately
   * 
   * @param {Object} entry - Entry metadata (id, duration, recordedAt, etc)
   * @param {Blob} videoBlob - Video blob to upload
   * @param {Blob} thumbnailBlob - Thumbnail blob (optional)
   * @returns {Promise<string>} Entry ID
   */
  async addToQueue(entry, videoBlob, thumbnailBlob = null) {
    const queueItem = {
      id: entry.id,
      entry: entry,
      videoBlob: videoBlob,
      thumbnailBlob: thumbnailBlob,
      retries: 0,
      createdAt: Date.now(),
      status: 'pending',
      error: null,
    };

    // Save to IndexedDB immediately (crash-safe)
    await storage.saveUploadQueueItem(queueItem.id, queueItem);
    
    console.log('📦 Added to upload queue:', queueItem.id);
    this.notifyListeners();

    // Start upload immediately
    this.processItem(queueItem.id);

    return queueItem.id;
  }

  /**
   * Process a single queue item with retry logic
   * Includes exponential backoff on failures
   */
  async processItem(itemId) {
    // Prevent duplicate processing
    if (this.uploading.has(itemId)) {
      console.log('⏭️ Already uploading:', itemId);
      return;
    }

    this.uploading.add(itemId);

    try {
      // Load item from IndexedDB
      const item = await storage.getUploadQueueItem(itemId);
      
      if (!item) {
        console.log('❌ Queue item not found:', itemId);
        this.uploading.delete(itemId);
        return;
      }

      if (item.status === 'completed') {
        console.log('✅ Already completed:', itemId);
        this.uploading.delete(itemId);
        return;
      }

      console.log(`📤 Uploading (attempt ${item.retries + 1}/${this.maxRetries}):`, itemId);

      // Update status to uploading
      item.status = 'uploading';
      item.error = null;
      await storage.saveUploadQueueItem(itemId, item);
      this.notifyListeners();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload video to R2
      console.log('📹 Uploading video to R2...');
      const videoUrl = await uploadVideo(item.videoBlob, user.id, item.id);
      
      // Upload thumbnail to R2 (optional, non-critical)
      let thumbnailUrl = null;
      if (item.thumbnailBlob) {
        console.log('🖼️ Uploading thumbnail to R2...');
        try {
          thumbnailUrl = await uploadVideo(item.thumbnailBlob, user.id, `${item.id}_thumb`);
        } catch (err) {
          console.warn('Thumbnail upload failed (non-critical):', err);
        }
      }

      // Save metadata to Supabase
      console.log('💾 Saving metadata to Supabase...');
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: item.entry.duration,
          file_size: item.videoBlob.size,
          transcription: item.entry.transcription || '',
          tags: item.entry.tags || [],
          type: item.entry.type || 'video',
          storage_type: 'cloud',
          recorded_at: item.entry.recordedAt,
        })
        .select()
        .single();

      if (error) throw error;

      // Mark as completed
      item.status = 'completed';
      await storage.saveUploadQueueItem(itemId, item);
      this.notifyListeners();

      console.log('✅ Upload completed:', itemId);

      // Add entry to store for immediate UI update (no page refresh needed)
      const newEntry = {
        id: data.id,
        userId: data.user_id,
        videoUrl: data.video_url,
        mediaUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        duration: data.duration,
        fileSize: data.file_size,
        transcription: data.transcription || '',
        tags: data.tags || [],
        type: data.type || 'video',
        storageType: data.storage_type || 'cloud',
        recordedAt: data.recorded_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      useEntriesStore.getState().addEntryToState(newEntry);

      // Clean up: Remove from IndexedDB after successful upload
      await storage.deleteUploadQueueItem(itemId);
      
      this.uploading.delete(itemId);
      this.notifyListeners();

      return data;

    } catch (error) {
      console.error('❌ Upload failed:', itemId, error);

      // Reload item to get latest state
      const item = await storage.getUploadQueueItem(itemId);
      if (!item) {
        this.uploading.delete(itemId);
        return;
      }

      item.retries += 1;
      item.error = error.message;

      if (item.retries >= this.maxRetries) {
        // Max retries reached - mark as failed but keep in queue
        item.status = 'failed';
        await storage.saveUploadQueueItem(itemId, item);
        console.error('💀 Max retries reached:', itemId);
        this.uploading.delete(itemId);
        this.notifyListeners();
        return;
      }

      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const delay = this.baseDelay * Math.pow(2, item.retries - 1);
      
      item.status = 'pending';
      await storage.saveUploadQueueItem(itemId, item);
      this.notifyListeners();
      
      console.log(`⏰ Retrying in ${delay}ms (attempt ${item.retries + 1}/${this.maxRetries})`);
      
      this.uploading.delete(itemId);

      // Retry after delay
      setTimeout(() => {
        this.processItem(itemId);
      }, delay);
    }
  }

  /**
   * Process all pending items in queue
   * Called on app startup to resume failed uploads
   */
  async processQueue() {
    console.log('🔄 Processing upload queue...');
    
    const items = await storage.getAllUploadQueueItems();
    
    console.log(`📋 Found ${items.length} items in queue`);

    for (const item of items) {
      if (item.status === 'completed') {
        // Clean up completed items that weren't removed
        await storage.deleteUploadQueueItem(item.id);
        continue;
      }

      if (item.status === 'failed' && item.retries >= this.maxRetries) {
        // Skip permanently failed items (user can manually retry)
        console.warn('⚠️ Skipping failed item (needs manual retry):', item.id);
        continue;
      }

      // Process pending/uploading items
      // Wait a bit between each to avoid overwhelming the server
      setTimeout(() => {
        this.processItem(item.id);
      }, Math.random() * 1000);
    }

    this.notifyListeners();
  }

  /**
   * Get all items in queue (for UI display)
   */
  async getAllItems() {
    return await storage.getAllUploadQueueItems();
  }

  /**
   * Get all failed uploads
   * For UI to show failed items and allow manual retry
   */
  async getFailedUploads() {
    const items = await storage.getAllUploadQueueItems();
    return items.filter(item => item.status === 'failed' && item.retries >= this.maxRetries);
  }

  /**
   * Get count of pending/uploading items
   */
  async getPendingCount() {
    const items = await storage.getAllUploadQueueItems();
    return items.filter(item => 
      item.status === 'pending' || item.status === 'uploading'
    ).length;
  }

  /**
   * Manually retry a failed upload
   * Resets retry count and starts upload
   */
  async retryFailedUpload(itemId) {
    const item = await storage.getUploadQueueItem(itemId);
    if (!item) {
      console.error('Queue item not found:', itemId);
      return;
    }

    console.log('🔄 Manually retrying upload:', itemId);

    // Reset retry count and status
    item.retries = 0;
    item.status = 'pending';
    item.error = null;
    await storage.saveUploadQueueItem(itemId, item);

    // Process immediately
    this.processItem(itemId);
    this.notifyListeners();
  }

  /**
   * Delete a failed upload permanently
   * User gives up on this recording
   */
  async deleteFailedUpload(itemId) {
    console.log('🗑️ Permanently deleting failed upload:', itemId);
    await storage.deleteUploadQueueItem(itemId);
    this.notifyListeners();
  }

  /**
   * Subscribe to queue changes (for UI updates)
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of queue changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}

export const uploadQueue = new UploadQueue();