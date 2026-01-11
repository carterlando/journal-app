import { supabase } from '../services/supabase';

/**
 * Memory Entry Search Utilities
 * 
 * Server-side search for "Remember this day" entries
 * Queries Supabase directly instead of loading all entries client-side
 * 
 * Simplified algorithm:
 * 1. Exact day match from exactly 1 year ago (same month/day, previous year)
 * 2. Exact day match from exactly 1 month ago (same day, previous month)
 * 3. Nothing (no fallbacks)
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
 * Find memory entry from Supabase
 * Only returns entries from exactly 1 year ago or exactly 1 month ago
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Memory entry or null
 */
export const findMemoryEntry = async (userId) => {
  if (!userId) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDay = today.getDate();

  try {
    // 1. CHECK FOR ENTRY FROM EXACTLY 1 YEAR AGO
    // Same month and day, but previous year
    const oneYearAgo = new Date(currentYear - 1, currentMonth, currentDay);
    const oneYearAgoStart = new Date(oneYearAgo);
    oneYearAgoStart.setHours(0, 0, 0, 0);
    const oneYearAgoEnd = new Date(oneYearAgo);
    oneYearAgoEnd.setHours(23, 59, 59, 999);

    const { data: yearAgoEntries, error: yearError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', oneYearAgoStart.toISOString())
      .lte('recorded_at', oneYearAgoEnd.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(10); // Get multiple if available, pick random

    if (yearError) throw yearError;

    if (yearAgoEntries && yearAgoEntries.length > 0) {
      // Pick random entry if multiple exist on that day
      const randomIndex = Math.floor(Math.random() * yearAgoEntries.length);
      console.log(`📅 Found ${yearAgoEntries.length} entry(ies) from 1 year ago (${oneYearAgo.toDateString()})`);
      return formatEntry(yearAgoEntries[randomIndex]);
    }

    // 2. CHECK FOR ENTRY FROM EXACTLY 1 MONTH AGO
    // Same day, but previous month (handles year boundary: Jan -> Dec of previous year)
    let oneMonthAgoYear = currentYear;
    let oneMonthAgoMonth = currentMonth - 1;
    
    // Handle year boundary (January -> December of previous year)
    if (oneMonthAgoMonth < 0) {
      oneMonthAgoMonth = 11; // December
      oneMonthAgoYear = currentYear - 1;
    }

    // Handle days that don't exist in target month (e.g., Jan 31 -> Feb 28/29)
    const daysInTargetMonth = new Date(oneMonthAgoYear, oneMonthAgoMonth + 1, 0).getDate();
    const targetDay = Math.min(currentDay, daysInTargetMonth);

    const oneMonthAgo = new Date(oneMonthAgoYear, oneMonthAgoMonth, targetDay);
    const oneMonthAgoStart = new Date(oneMonthAgo);
    oneMonthAgoStart.setHours(0, 0, 0, 0);
    const oneMonthAgoEnd = new Date(oneMonthAgo);
    oneMonthAgoEnd.setHours(23, 59, 59, 999);

    const { data: monthAgoEntries, error: monthError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', oneMonthAgoStart.toISOString())
      .lte('recorded_at', oneMonthAgoEnd.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(10); // Get multiple if available, pick random

    if (monthError) throw monthError;

    if (monthAgoEntries && monthAgoEntries.length > 0) {
      // Pick random entry if multiple exist on that day
      const randomIndex = Math.floor(Math.random() * monthAgoEntries.length);
      console.log(`📅 Found ${monthAgoEntries.length} entry(ies) from 1 month ago (${oneMonthAgo.toDateString()})`);
      return formatEntry(monthAgoEntries[randomIndex]);
    }

    // 3. NO MEMORY FOUND
    console.log('📅 No memory found for today (neither 1 year ago nor 1 month ago)');
    return null;

  } catch (error) {
    console.error('Memory search failed:', error);
    return null;
  }
};