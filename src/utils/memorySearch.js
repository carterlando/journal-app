import { supabase } from '../services/supabase';

/**
 * Memory Entry Search Utilities
 * 
 * Server-side search for "Remember this day" entries
 * Queries Supabase directly instead of loading all entries client-side
 * 
 * Cascading search algorithm:
 * 1. Exact day match (same day/month, earlier year)
 * 2. ±7 days match (same week range, earlier year)  
 * 3. Same month match (earlier year)
 * 4. Random past entry (fallback)
 */

/**
 * Convert Supabase entry to app format
 * @param {Object} entry - Raw Supabase entry
 * @returns {Object} Formatted entry
 */
const formatEntry = (entry) => ({
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
});

/**
 * Find memory entry from Supabase using server-side filtering
 * Much faster than loading all entries and filtering client-side
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Memory entry or null
 */
export const findMemoryEntry = async (userId) => {
  if (!userId) return null;

  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();

  try {
    // Query past entries, limited for performance
    const { data: pastEntries, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .lt('recorded_at', `${currentYear}-01-01`) // Only previous years
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    if (pastEntries && pastEntries.length > 0) {
      // 1. EXACT DAY MATCH - Same month/day, previous years
      const exactDayMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recorded_at);
        return (
          entryDate.getMonth() + 1 === currentMonth &&
          entryDate.getDate() === currentDay
        );
      });

      if (exactDayMatches.length > 0) {
        const randomIndex = Math.floor(Math.random() * exactDayMatches.length);
        return formatEntry(exactDayMatches[randomIndex]);
      }

      // 2. ±7 DAYS MATCH - Same week range, previous years
      const weekRangeMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recorded_at);
        const entryMonth = entryDate.getMonth() + 1;
        const entryDay = entryDate.getDate();
        
        if (entryMonth === currentMonth) {
          return Math.abs(entryDay - currentDay) <= 7;
        }
        
        // Handle month boundaries
        if (entryMonth === currentMonth - 1 || (currentMonth === 1 && entryMonth === 12)) {
          if (currentDay <= 7 && entryDay >= 24) return true;
        }
        if (entryMonth === currentMonth + 1 || (currentMonth === 12 && entryMonth === 1)) {
          if (currentDay >= 24 && entryDay <= 7) return true;
        }
        
        return false;
      });

      if (weekRangeMatches.length > 0) {
        const closest = weekRangeMatches.reduce((best, entry) => {
          const entryDate = new Date(entry.recorded_at);
          const bestDate = new Date(best.recorded_at);
          const entryDayDiff = Math.abs(entryDate.getDate() - currentDay);
          const bestDayDiff = Math.abs(bestDate.getDate() - currentDay);
          return entryDayDiff < bestDayDiff ? entry : best;
        });
        return formatEntry(closest);
      }

      // 3. SAME MONTH MATCH - Any day in same month, previous years
      const sameMonthMatches = pastEntries.filter(entry => {
        const entryDate = new Date(entry.recorded_at);
        return entryDate.getMonth() + 1 === currentMonth;
      });

      if (sameMonthMatches.length > 0) {
        const randomIndex = Math.floor(Math.random() * sameMonthMatches.length);
        return formatEntry(sameMonthMatches[randomIndex]);
      }

      // 4. RANDOM FALLBACK - Any past entry
      const randomIndex = Math.floor(Math.random() * pastEntries.length);
      return formatEntry(pastEntries[randomIndex]);
    }

    // No entries from previous years, try any past entry (random)
    const { data: anyPast, error: anyError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .lt('recorded_at', today.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (anyError) throw anyError;

    if (anyPast && anyPast.length > 0) {
      const randomIndex = Math.floor(Math.random() * anyPast.length);
      return formatEntry(anyPast[randomIndex]);
    }

    return null;

  } catch (error) {
    console.error('Memory search failed:', error);
    return null;
  }
};