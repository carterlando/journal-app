import { supabase } from './supabase';

/**
 * Entries Service
 * 
 * Handles all entry operations with Supabase
 * Each entry is linked to a user via user_id
 */

/**
 * Fetch all entries for the current user
 * 
 * @returns {Promise<Array>} User's entries
 */
export const fetchUserEntries = async () => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  
  // Convert snake_case to camelCase for consistency with frontend
  return data.map(entry => ({
    id: entry.id,
    userId: entry.user_id,
    videoUrl: entry.video_url,
    thumbnailUrl: entry.thumbnail_url,
    duration: entry.duration,
    fileSize: entry.file_size,
    transcription: entry.transcription,
    tags: entry.tags || [],
    storageType: entry.storage_type,
    recordedAt: entry.recorded_at,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }));
};

/**
 * Create a new entry in Supabase
 * 
 * @param {Object} entry - Entry data
 * @returns {Promise<Object>} Created entry
 */
export const createEntry = async (entry) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

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
      storage_type: entry.storageType || 'cloud',
      recorded_at: entry.recordedAt,
    })
    .select()
    .single();

  if (error) throw error;

  // Convert back to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    videoUrl: data.video_url,
    thumbnailUrl: data.thumbnail_url,
    duration: data.duration,
    fileSize: data.file_size,
    transcription: data.transcription,
    tags: data.tags,
    storageType: data.storage_type,
    recordedAt: data.recorded_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Update an existing entry
 * 
 * @param {string} id - Entry ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated entry
 */
export const updateEntry = async (id, updates) => {
  // Convert camelCase to snake_case for database
  const dbUpdates = {};
  if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
  if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
  if (updates.transcription !== undefined) dbUpdates.transcription = updates.transcription;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.storageType !== undefined) dbUpdates.storage_type = updates.storageType;

  const { data, error } = await supabase
    .from('entries')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    videoUrl: data.video_url,
    thumbnailUrl: data.thumbnail_url,
    duration: data.duration,
    fileSize: data.file_size,
    transcription: data.transcription,
    tags: data.tags,
    storageType: data.storage_type,
    recordedAt: data.recorded_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Delete an entry
 * 
 * @param {string} id - Entry ID
 */
export const deleteEntry = async (id) => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Get entries for a specific date
 * 
 * @param {Date} date - Date to filter by
 * @returns {Promise<Array>} Entries for that date
 */
export const fetchEntriesForDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .gte('recorded_at', startOfDay.toISOString())
    .lte('recorded_at', endOfDay.toISOString())
    .order('recorded_at', { ascending: false });

  if (error) throw error;

  return data.map(entry => ({
    id: entry.id,
    userId: entry.user_id,
    videoUrl: entry.video_url,
    thumbnailUrl: entry.thumbnail_url,
    duration: entry.duration,
    fileSize: entry.file_size,
    transcription: entry.transcription,
    tags: entry.tags || [],
    storageType: entry.storage_type,
    recordedAt: entry.recorded_at,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  }));
};