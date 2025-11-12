import { create } from 'zustand';
import { platform } from '../adapters';

/**
 * Journal Entries Store
 * 
 * Manages all journal entries in the app.
 * Uses Zustand for simple, Redux-like state management without the boilerplate.
 * PERSISTS entries to local storage so they survive page refreshes.
 * 
 * State structure:
 * - entries: Array of journal entry objects
 * - loading: Boolean indicating if we're fetching data
 * - error: Error message if something goes wrong
 * 
 * Each entry object looks like:
 * {
 *   id: 'uuid-string',
 *   createdAt: '2025-01-15T10:30:00Z',
 *   recordedAt: '2025-01-15T10:25:00Z',  // Might differ from createdAt
 *   type: 'video' | 'audio',
 *   duration: 125,  // seconds
 *   mediaUrl: 'https://...',  // URL to video/audio file
 *   thumbnailUrl: 'https://...',  // URL to thumbnail image
 *   transcription: 'Today I went to...',  // Auto-generated from speech
 *   location: { lat: 45.5, lng: -122.6, name: 'Portland, OR' },
 *   tags: ['work', 'family'],
 *   mood: 'happy',
 *   isUploading: false,  // True while file is being uploaded
 *   uploadProgress: 0,  // 0-100
 * }
 */

const useEntriesStore = create((set, get) => ({
  // ==================== STATE ====================
  
  entries: [],  // All journal entries
  loading: false,  // True when fetching from API
  error: null,  // Error message string, or null if no error

  // ==================== PERSISTENCE HELPER ====================
  
  /**
   * Save entries to local storage
   * Called internally after any change to entries
   * Why: Keeps local storage in sync with state automatically
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
   * Load entries from local storage
   * Called on app startup to restore saved entries
   * Why: User's journal entries persist across sessions
   */
  loadEntries: async () => {
    try {
      const entries = await platform.getFromLocal('entries');
      
      if (entries && Array.isArray(entries)) {
        set({ entries });
      }
    } catch (error) {
      console.error('Failed to load entries from local storage:', error);
      set({ error: 'Failed to load entries from storage' });
    }
  },

  /**
   * Add a new entry to the store
   * Used when creating a new journal entry
   * AUTOMATICALLY PERSISTS to local storage
   * 
   * @param {Object} entry - The entry object to add
   */
  addEntry: async (entry) => {
    set((state) => ({
      // Add to beginning of array (newest first)
      entries: [entry, ...state.entries],
    }));
    
    // Save to local storage after adding
    await get()._saveToLocal();
  },

  /**
   * Update an existing entry
   * Used when upload completes, transcription finishes, etc.
   * AUTOMATICALLY PERSISTS to local storage
   * 
   * @param {string} id - Entry ID to update
   * @param {Object} updates - Fields to update
   */
  updateEntry: async (id, updates) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates }  // Merge updates into existing entry
          : entry
      ),
    }));
    
    // Save to local storage after updating
    await get()._saveToLocal();
  },

  /**
   * Delete an entry
   * Removes from local state, localStorage, AND IndexedDB
   * 
   * @param {string} id - Entry ID to delete
   */
  deleteEntry: async (id) => {
    // Remove from state
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
    }));
    
    // Save to localStorage
    await get()._saveToLocal();
    
    // Delete video blob from IndexedDB
    try {
      const { storage } = await import('../services/storage');
      if (storage.db) {
        await storage.deleteVideo(id);
      }
    } catch (error) {
      console.error('Failed to delete video from IndexedDB:', error);
    }
  },

  /**
   * Set all entries at once
   * Used when fetching entries from the backend API
   * AUTOMATICALLY PERSISTS to local storage
   * 
   * @param {Array} entries - Array of entry objects
   */
  setEntries: async (entries) => {
    set({ entries });
    
    // Save to local storage after setting
    await get()._saveToLocal();
  },

  /**
   * Set loading state
   * Shows/hides loading spinner in UI
   * 
   * @param {boolean} loading - True to show loading, false to hide
   */
  setLoading: (loading) => {
    set({ loading });
  },

  /**
   * Set error message
   * Displays error to user
   * 
   * @param {string|null} error - Error message or null to clear
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * Clear all errors
   * Typically called when user dismisses error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Get entries for a specific date
   * Useful for calendar view or daily summaries
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
   * Searches in transcription text and tags
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
   * Clear all entries
   * Used for logout or data reset
   * REMOVES from local storage too
   */
  clearEntries: async () => {
    set({ entries: [], error: null, loading: false });
    
    // Clear from local storage
    try {
      await platform.removeFromLocal('entries');
    } catch (error) {
      console.error('Failed to clear entries from local storage:', error);
    }
  },
}));

export default useEntriesStore;