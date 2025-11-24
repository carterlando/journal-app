import { create } from 'zustand';
import { platform } from '../adapters';
import { supabase } from '../services/supabase';
import { deleteVideo } from '../services/r2';

/**
 * Journal Entries Store
 * 
 * Manages all journal entries in the app.
 * Uses Zustand for state management with Supabase backend.
 * 
 * State structure:
 * - entries: Array of journal entry objects
 * - loading: Boolean indicating if we're fetching data
 * - error: Error message if something goes wrong
 * 
 * Each entry object looks like:
 * {
 *   id: 'uuid-string',
 *   userId: 'user-uuid',
 *   videoUrl: 'https://r2.../video.webm',  // R2 URL
 *   mediaUrl: 'https://r2.../video.webm',  // Same as videoUrl for now
 *   thumbnailUrl: 'https://r2.../thumb.webm',
 *   duration: 125,  // seconds
 *   fileSize: 52428800,  // bytes
 *   transcription: 'Today I went to...',
 *   tags: ['work', 'family'],
 *   type: 'video' | 'audio',
 *   storageType: 'cloud' | 'local',
 *   recordedAt: '2025-01-15T10:25:00Z',
 *   createdAt: '2025-01-15T10:30:00Z',
 *   updatedAt: '2025-01-15T10:30:00Z',
 * }
 */

const useEntriesStore = create((set, get) => ({
  // ==================== STATE ====================
  
  entries: [],  // All journal entries
  loading: false,  // True when fetching from API
  error: null,  // Error message string, or null if no error

  // ==================== PERSISTENCE HELPER ====================
  
  /**
   * Save entries to local storage as backup
   * Called internally after any change to entries
   * Why: Provides offline access and faster loading
   */
  _saveToLocal: async () => {
    try {
      const { entries } = get();
      await platform.saveToLocal('entries', entries);
    } catch (error) {
      console.error('Failed to save entries to local storage:', error);
    }
  },

  // ==================== ACTIONS ====================

  /**
   * Load entries from Supabase
   * Called on app startup to fetch user's entries
   */
  loadEntries: async () => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated - try loading from local storage
        const localEntries = await platform.getFromLocal('entries');
        if (localEntries && Array.isArray(localEntries)) {
          set({ entries: localEntries, loading: false });
        } else {
          set({ entries: [], loading: false });
        }
        return;
      }

      // Fetch from Supabase
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Convert snake_case to camelCase
      const entries = data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        videoUrl: entry.video_url,
        mediaUrl: entry.video_url,  // Use videoUrl as mediaUrl
        thumbnailUrl: entry.thumbnail_url,
        duration: entry.duration,
        fileSize: entry.file_size,
        transcription: entry.transcription || '',
        tags: entry.tags || [],
        type: entry.type || 'video',
        storageType: entry.storage_type || 'cloud',
        recordedAt: entry.recorded_at,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      }));

      set({ entries, loading: false });

    } catch (error) {
      console.error('Failed to load entries from Supabase:', error);
      set({ error: 'Failed to load entries', loading: false });
    }
  },

  /**
   * Add a new entry to Supabase
   * Uploads are already done, just saving metadata
   * 
   * @param {Object} entry - The entry object to add
   */
  addEntry: async (entry) => {
    try {
      set({ loading: true });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Inserting entry to Supabase:', entry);

      // Insert into Supabase
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          video_url: entry.videoUrl,
          thumbnail_url: entry.thumbnailUrl,
          duration: entry.duration,
          file_size: entry.fileSize,
          transcription: entry.transcription || '',
          tags: entry.tags || [],
          type: entry.type || 'video',
          storage_type: entry.storageType || 'cloud',
          recorded_at: entry.recordedAt,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Entry saved to Supabase:', data.id);

      // Convert to camelCase and add to state
      const newEntry = {
        id: data.id,
        userId: data.user_id,
        videoUrl: data.video_url,
        mediaUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        duration: data.duration,
        fileSize: data.file_size,
        transcription: data.transcription,
        tags: data.tags,
        type: data.type,
        storageType: data.storage_type,
        recordedAt: data.recorded_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      set((state) => ({
        entries: [newEntry, ...state.entries],
        loading: false,
      }));
      
      // Save to local storage as backup
      await get()._saveToLocal();

    } catch (error) {
      console.error('Failed to add entry:', error);
      set({ error: `Failed to save entry: ${error.message}`, loading: false });
      throw error;
    }
  },

  /**
   * Update an existing entry
   * 
   * @param {string} id - Entry ID to update
   * @param {Object} updates - Fields to update
   */
  updateEntry: async (id, updates) => {
    try {
      // Convert camelCase to snake_case for database
      const dbUpdates = {};
      if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
      if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
      if (updates.transcription !== undefined) dbUpdates.transcription = updates.transcription;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.storageType !== undefined) dbUpdates.storage_type = updates.storageType;

      const { error } = await supabase
        .from('entries')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Update in state
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry
        ),
      }));
      
      // Save to local storage
      await get()._saveToLocal();

    } catch (error) {
      console.error('Failed to update entry:', error);
      set({ error: `Failed to update entry: ${error.message}` });
    }
  },

  
  /**
   * Delete an entry from Supabase AND R2 storage
   * 
   * @param {string} id - Entry ID to delete
   */
  deleteEntry: async (id) => {
    try {
      console.log('=== DELETE ENTRY START ===');
      console.log('Entry ID to delete:', id);
      
      // Get the entry first to get video URLs
      const entry = get().entries.find(e => e.id === id);
      
      if (!entry) {
        console.error('Entry not found in state:', id);
        throw new Error('Entry not found');
      }
      
      console.log('Found entry to delete:', {
        id: entry.id,
        videoUrl: entry.videoUrl,
        thumbnailUrl: entry.thumbnailUrl
      });
      
      // Delete from Supabase database
      console.log('Deleting from Supabase database...');
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('✅ Successfully deleted from Supabase');

      // Delete videos from R2 storage
      console.log('Starting R2 deletion...');
      
      // Delete main video
      if (entry.videoUrl || entry.mediaUrl) {
        const videoUrl = entry.videoUrl || entry.mediaUrl;
        console.log('Attempting to delete main video from R2:', videoUrl);
        
        try {
          await deleteVideo(videoUrl);
          console.log('✅ Successfully deleted main video from R2');
        } catch (r2Error) {
          console.error('❌ Failed to delete main video from R2:', r2Error);
        }
      } else {
        console.log('⚠️ No main video URL found');
      }
      
      // Delete thumbnail
      if (entry.thumbnailUrl) {
        console.log('Attempting to delete thumbnail from R2:', entry.thumbnailUrl);
        
        try {
          await deleteVideo(entry.thumbnailUrl);
          console.log('✅ Successfully deleted thumbnail from R2');
        } catch (r2Error) {
          console.error('❌ Failed to delete thumbnail from R2:', r2Error);
        }
      } else {
        console.log('⚠️ No thumbnail URL found');
      }

      // Remove from state
      console.log('Removing from local state...');
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }));
      console.log('✅ Removed from state');
      
      // Save to local storage
      console.log('Saving to local storage...');
      await get()._saveToLocal();
      console.log('✅ Saved to local storage');
      
      console.log('=== DELETE ENTRY COMPLETE ===');

    } catch (error) {
      console.error('=== DELETE ENTRY FAILED ===');
      console.error('Error details:', error);
      set({ error: `Failed to delete entry: ${error.message}` });
    }
  },

  /**
   * Set all entries at once
   * Used when fetching entries from backend
   * 
   * @param {Array} entries - Array of entry objects
   */
  setEntries: async (entries) => {
    set({ entries });
    await get()._saveToLocal();
  },

  /**
   * Set loading state
   * 
   * @param {boolean} loading - True to show loading, false to hide
   */
  setLoading: (loading) => {
    set({ loading });
  },

  /**
   * Set error message
   * 
   * @param {string|null} error - Error message or null to clear
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * Clear all errors
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Get entries for a specific date
   * 
   * @param {Date} date - The date to filter by
   * @returns {Array} Entries recorded on that date
   */
  getEntriesForDate: (date) => {
    const entries = get().entries;
    const dateString = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    return entries.filter((entry) => {
      const entryDate = new Date(entry.recordedAt).toISOString().split('T')[0];
      return entryDate === dateString;
    });
  },

  /**
   * Search entries by text
   * 
   * @param {string} query - Search term
   * @returns {Array} Matching entries
   */
  searchEntries: (query) => {
    const entries = get().entries;
    const lowerQuery = query.toLowerCase();
    
    return entries.filter((entry) =>
      entry.transcription?.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Clear all entries (used on logout)
   */
  clearEntries: async () => {
    set({ entries: [], error: null, loading: false });
    
    try {
      await platform.removeFromLocal('entries');
    } catch (error) {
      console.error('Failed to clear entries from local storage:', error);
    }
  },
}));

export default useEntriesStore;