import { create } from 'zustand';
import { platform } from '../adapters';

/**
 * Authentication Store
 * 
 * Manages user authentication state and tokens.
 * Persists auth data to local storage so user stays logged in.
 * 
 * State structure:
 * - user: Current user object or null
 * - token: JWT token for API authentication
 * - isAuthenticated: Boolean for quick auth checks
 * - loading: Boolean for login/signup operations
 */

const useAuthStore = create((set, get) => ({
  // ==================== STATE ====================
  
  user: null,  // User object: { id, email, name, createdAt }
  token: null,  // JWT token string
  isAuthenticated: false,  // Quick check if user is logged in
  loading: false,  // True during login/signup/logout

  // ==================== ACTIONS ====================

  /**
   * Set authenticated user and token
   * Called after successful login or signup
   * Persists to local storage so user stays logged in
   * 
   * @param {Object} user - User object from backend
   * @param {string} token - JWT token
   */
  setAuth: async (user, token) => {
    // Save to state
    set({
      user,
      token,
      isAuthenticated: true,
    });

    // Persist to local storage using our platform adapter
    // Why: So user doesn't have to login again when they close the app
    try {
      await platform.saveToLocal('auth', { user, token });
    } catch (error) {
      console.error('Failed to save auth to local storage:', error);
    }
  },

  /**
   * Load authentication from local storage
   * Called on app startup to restore logged-in state
   * 
   * @returns {boolean} True if auth was restored, false otherwise
   */
  loadAuth: async () => {
    try {
      // Try to get saved auth from local storage
      const auth = await platform.getFromLocal('auth');
      
      if (auth && auth.user && auth.token) {
        set({
          user: auth.user,
          token: auth.token,
          isAuthenticated: true,
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to load auth from local storage:', error);
    }
    
    return false;
  },

  /**
   * Update user information
   * Used when user changes their profile
   * 
   * @param {Object} updates - Fields to update on user object
   */
  updateUser: async (updates) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...updates };
    
    set({ user: updatedUser });

    // Update in local storage too
    try {
      const auth = await platform.getFromLocal('auth');
      if (auth) {
        await platform.saveToLocal('auth', {
          ...auth,
          user: updatedUser,
        });
      }
    } catch (error) {
      console.error('Failed to update user in local storage:', error);
    }
  },

  /**
   * Logout user
   * Clears all auth data from state and local storage
   */
  logout: async () => {
    // Clear state
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    // Clear from local storage
    try {
      await platform.removeFromLocal('auth');
    } catch (error) {
      console.error('Failed to remove auth from local storage:', error);
    }
  },

  /**
   * Set loading state
   * Shows/hides loading spinner during auth operations
   * 
   * @param {boolean} loading - True to show loading, false to hide
   */
  setLoading: (loading) => {
    set({ loading });
  },
}));

export default useAuthStore;