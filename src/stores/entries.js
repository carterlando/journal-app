import { create } from 'zustand';
import { 
  fetchUserEntries, 
  createEntry as createEntryAPI, 
  updateEntry as updateEntryAPI,
  deleteEntry as deleteEntryAPI 
} from '../services/entries';

/**
 * Journal Entries Store
 * 
 * Manages all journal entries from Supabase.
 * No local persistence - everything is in the cloud database.
 */

const useEntriesStore = create((set, get) => ({
  // ==================== STATE ====================
  
  entries: [],
  loading: false,
  error: null,

  // ==================== ACTIONS ====================

  /**
   * Load entries from Supabase for current user
   */
  loadEntries: async () => {
    set({ loading: true, error: null });
    
    try {
      const entries = await fetchUserEntries();
      set({ entries, loading: false });
    } catch (error) {
      console.error('Failed to load entries:', error);
      set({ 
        error: 'Failed to load entries from database', 
        loading: false,
        entries: [] 
      });
    }
  },

  /**
   * Add a new entry
   * Saves to Supabase immediately
   * 
   * @param {Object} entry - Entry data
   */
  addEntry: async (entry) => {
    try {
      const savedEntry = await createEntryAPI(entry);
      
      set((state) => ({
        entries: [savedEntry, ...state.entries],
      }));
      
      return savedEntry;
    } catch (error) {
      console.error('Failed to create entry:', error);
      set({ error: 'Failed to save entry to database' });
      throw error;
    }
  },

  /**
   * Update an existing entry
   * 
   * @param {string} id - Entry ID
   * @param {Object} updates - Fields to update
   */
  updateEntry: async (id, updates) => {
    try {
      const updatedEntry = await updateEntryAPI(id, updates);
      
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
      }));
    } catch (error) {
      console.error('Failed to update entry:', error);
      set({ error: 'Failed to update entry in database' });
      throw error;
    }
  },

  /**
   * Delete an entry
   * 
   * @param {string} id - Entry ID
   */
  deleteEntry: async (id) => {
    try {
      await deleteEntryAPI(id);
      
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete entry:', error);
      set({ error: 'Failed to delete entry from database' });
      throw error;
    }
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
   * Get entries for a specific date (from current state)
   * 
   * @param {Date} date - The date to filter by
   * @returns {Array} Entries recorded on that date
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
   * Search entries by text (from current state)
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
   * Clear all entries (for logout)
   */
  clearEntries: () => {
    set({ entries: [], error: null, loading: false });
  },
}));

export default useEntriesStore;