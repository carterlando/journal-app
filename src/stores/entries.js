import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { deleteVideo } from '../services/r2';

/**
 * Journal Entries Store
 * 
 * Cloud-first storage strategy:
 * - R2 for video files (permanent storage)
 * - Supabase for metadata (source of truth)
 * - IndexedDB for upload queue only (reliable uploads)
 * - No localStorage persistence for entries
 * 
 * Why this approach:
 * - Videos upload via queue system with retry
 * - Supabase is always source of truth for entries list
 * - Eliminates sync issues between local and cloud
 * - Upload queue handles failures gracefully
 */

const useEntriesStore = create((set, get) => ({
  // ==================== STATE ====================
  
  entries: [],
  loading: false,
  error: null,

  // ==================== ACTIONS ====================

  /**
   * Load entries from Supabase
   * Called on app startup and after auth
   */
  loadEntries: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ entries: [], loading: false });
        return;
      }

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
        mediaUrl: entry.video_url,
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
      console.error('Failed to load entries:', error);
      set({ error: 'Failed to load entries', loading: false });
    }
  },

  /**
   * Add entry to state after successful upload
   * Called by upload queue after Supabase insert
   * 
   * Note: This is just for optimistic UI update
   * The upload queue handles the actual database insert
   */
  addEntryToState: (entry) => {
    set((state) => ({
      entries: [entry, ...state.entries],
    }));
  },

  /**
   * Update an existing entry
   */
  updateEntry: async (id, updates) => {
    try {
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

    } catch (error) {
      console.error('Failed to update entry:', error);
      set({ error: `Failed to update entry: ${error.message}` });
    }
  },

  /**
   * Delete entry from Supabase AND R2 storage
   */
  deleteEntry: async (id) => {
    try {
      const entry = get().entries.find(e => e.id === id);
      if (!entry) throw new Error('Entry not found');

      console.log('🗑️ Deleting entry:', id);

      // Delete from Supabase database
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete videos from R2 (non-critical if fails)
      if (entry.videoUrl || entry.mediaUrl) {
        const videoUrl = entry.videoUrl || entry.mediaUrl;
        try {
          await deleteVideo(videoUrl);
          console.log('✅ Deleted video from R2');
        } catch (r2Error) {
          console.error('Failed to delete video from R2:', r2Error);
        }
      }
      
      if (entry.thumbnailUrl) {
        try {
          await deleteVideo(entry.thumbnailUrl);
          console.log('✅ Deleted thumbnail from R2');
        } catch (r2Error) {
          console.error('Failed to delete thumbnail from R2:', r2Error);
        }
      }

      // Remove from state
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }));

      console.log('✅ Entry deleted successfully');

    } catch (error) {
      console.error('Delete entry failed:', error);
      set({ error: `Failed to delete entry: ${error.message}` });
    }
  },

  /**
   * Set all entries (used when fetching from backend)
   */
  setEntries: (entries) => {
    set({ entries });
  },

  /**
   * Set loading state
   */
  setLoading: (loading) => {
    set({ loading });
  },

  /**
   * Set error message
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
   */
  getEntriesForDate: (date) => {
    const entries = get().entries;
    const dateString = date.toISOString().split('T')[0];
    
    return entries.filter((entry) => {
      const entryDate = new Date(entry.recordedAt).toISOString().split('T')[0];
      return entryDate === dateString;
    });
  },

  /**
   * Search entries by text
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
  clearEntries: () => {
    set({ entries: [], error: null, loading: false });
  },
}));

export default useEntriesStore;