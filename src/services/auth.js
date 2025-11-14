import { supabase } from './supabase';

/**
 * Authentication Service
 * 
 * Handles user signup, login, logout
 * Uses Supabase Auth
 */

/**
 * Sign up with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session}>}
 */
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session}>}
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get current session
 * 
 * @returns {Promise<Session|null>}
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Get current user
 * 
 * @returns {Promise<User|null>}
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Listen to auth state changes
 * 
 * @param {Function} callback - Called when auth state changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};