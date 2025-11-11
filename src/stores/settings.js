import { create } from 'zustand';
import { platform } from '../adapters';

/**
 * Settings Store
 * 
 * Manages user preferences and app settings.
 * All settings are persisted to local storage.
 * 
 * Settings include:
 * - Video quality preferences
 * - Notification preferences
 * - Display preferences (theme, etc.)
 * - Privacy settings
 */

const useSettingsStore = create((set, get) => ({
  // ==================== STATE ====================
  
  // Video recording settings
  videoQuality: 'high',  // 'low' | 'medium' | 'high'
  maxVideoDuration: 300,  // seconds (5 minutes default)
  autoUpload: true,  // Upload immediately after recording
  
  // Audio settings
  audioOnly: false,  // Record audio only (no video)
  
  // Display settings
  theme: 'light',  // 'light' | 'dark' | 'auto'
  
  // Privacy settings
  enableLocation: true,  // Include location in entries
  enableTranscription: true,  // Auto-transcribe audio to text
  
  // Notification settings
  notificationsEnabled: false,
  dailyReminderTime: '20:00',  // 8 PM default
  
  // Storage settings
  keepLocalCopies: true,  // Keep videos locally after upload
  
  // ==================== ACTIONS ====================

  /**
   * Load settings from local storage
   * Called on app startup
   */
  loadSettings: async () => {
    try {
      const settings = await platform.getFromLocal('settings');
      
      if (settings) {
        // Merge saved settings with defaults
        // Why: In case we add new settings in app updates
        set((state) => ({
          ...state,
          ...settings,
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  /**
   * Update a single setting
   * Automatically persists to local storage
   * 
   * @param {string} key - Setting key to update
   * @param {any} value - New value
   */
  updateSetting: async (key, value) => {
    // Update in state
    set({ [key]: value });

    // Persist all settings to local storage
    try {
      const currentSettings = get();
      
      // Extract only the settings (not the action functions)
      const settingsToSave = {
        videoQuality: currentSettings.videoQuality,
        maxVideoDuration: currentSettings.maxVideoDuration,
        autoUpload: currentSettings.autoUpload,
        audioOnly: currentSettings.audioOnly,
        theme: currentSettings.theme,
        enableLocation: currentSettings.enableLocation,
        enableTranscription: currentSettings.enableTranscription,
        notificationsEnabled: currentSettings.notificationsEnabled,
        dailyReminderTime: currentSettings.dailyReminderTime,
        keepLocalCopies: currentSettings.keepLocalCopies,
      };
      
      await platform.saveToLocal('settings', settingsToSave);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  /**
   * Update multiple settings at once
   * More efficient than calling updateSetting multiple times
   * 
   * @param {Object} updates - Object with multiple key-value pairs
   */
  updateSettings: async (updates) => {
    // Update in state
    set(updates);

    // Persist to local storage
    try {
      const currentSettings = get();
      
      const settingsToSave = {
        videoQuality: currentSettings.videoQuality,
        maxVideoDuration: currentSettings.maxVideoDuration,
        autoUpload: currentSettings.autoUpload,
        audioOnly: currentSettings.audioOnly,
        theme: currentSettings.theme,
        enableLocation: currentSettings.enableLocation,
        enableTranscription: currentSettings.enableTranscription,
        notificationsEnabled: currentSettings.notificationsEnabled,
        dailyReminderTime: currentSettings.dailyReminderTime,
        keepLocalCopies: currentSettings.keepLocalCopies,
      };
      
      await platform.saveToLocal('settings', settingsToSave);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  /**
   * Reset all settings to defaults
   * Useful for troubleshooting or user preference
   */
  resetSettings: async () => {
    const defaults = {
      videoQuality: 'high',
      maxVideoDuration: 300,
      autoUpload: true,
      audioOnly: false,
      theme: 'light',
      enableLocation: true,
      enableTranscription: true,
      notificationsEnabled: false,
      dailyReminderTime: '20:00',
      keepLocalCopies: true,
    };

    set(defaults);

    try {
      await platform.saveToLocal('settings', defaults);
    } catch (error) {
      console.error('Failed to save default settings:', error);
    }
  },
}));

export default useSettingsStore;