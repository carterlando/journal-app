import { create } from 'zustand';
import { getCurrentUser, getSession, signOut, onAuthStateChange } from '../services/auth';
import useEntriesStore from './entries';

/**
 * Auth Store
 * 
 * Manages authentication state using Supabase
 */

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  /**
   * Initialize auth state
   * Checks for existing session and sets up listener
   */
  initialize: async () => {
    try {
      const session = await getSession();
      
      // Only get user if session exists
      let user = null;
      if (session) {
        user = await getCurrentUser();
      }

      set({
        user,
        session,
        isAuthenticated: !!session,
        loading: false,
      });

      // Listen for auth changes
      onAuthStateChange((event, session) => {
        set({
          user: session?.user || null,
          session,
          isAuthenticated: !!session,
        });
        
        // Load entries when user logs in
        if (session) {
          useEntriesStore.getState().loadEntries();
        } else {
          // Clear entries when user logs out
          useEntriesStore.getState().clearEntries();
        }
      });
    } catch (error) {
      // Silently handle missing session on first load
      if (error.message?.includes('Auth session missing')) {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          loading: false,
        });
      } else {
        console.error('Auth initialization error:', error);
        set({ loading: false });
      }
    }
  },

  /**
   * Sign out user
   */
  logout: async () => {
    try {
      await signOut();
      
      // Clear entries when logging out
      useEntriesStore.getState().clearEntries();
      
      set({
        user: null,
        session: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Refresh user data
   */
  refreshUser: async () => {
    try {
      const session = await getSession();
      let user = null;
      if (session) {
        user = await getCurrentUser();
      }
      set({
        user,
        session,
        isAuthenticated: !!session,
      });
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },
}));

export default useAuthStore;