/**
 * Date/Time formatting utilities
 */

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date (e.g., "Jan 15, 2025")
 */
export const formatDisplayDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get date string for comparison (YYYY-MM-DD)
 * @param {string|Date} date - Date to convert
 * @returns {string} - Date string
 */
export const getDateKey = (date) => {
  return new Date(date).toISOString().split('T')[0];
};