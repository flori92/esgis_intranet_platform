/**
 * ============================================
 * Supabase Configuration & Client
 * Production-optimized configuration
 * ============================================
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration with fallbacks
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase configuration. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

/**
 * Singleton Supabase client
 * Ensures single instance across the application
 */
let supabaseInstance = null

/**
 * Get or create Supabase client
 * @returns {SupabaseClient}
 */
export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
  return supabaseInstance
}

/**
 * Export singleton client for direct use
 */
export const supabase = getSupabaseClient()

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Supabase connection test failed:', error.message)
    return false
  }
}

/**
 * Handle Supabase errors with context
 * @param {Error} error - Supabase error
 * @param {string} context - Operation context
 * @returns {string} User-friendly error message
 */
export function formatSupabaseError(error, context = 'Operation') {
  if (!error) return 'Unknown error'

  // Supabase specific errors
  if (error.code === 'PGRST116') {
    return `${context}: Record not found`
  }
  if (error.code === 'PGRST202') {
    return `${context}: Duplicate entry - this record already exists`
  }
  if (error.code === 'PGRST205') {
    return `${context}: Invalid input - please check your data`
  }
  if (error.code === '23505') {
    return `${context}: This entry already exists`
  }
  if (error.code === '23503') {
    return `${context}: Referenced record not found`
  }
  if (error.code === '42P01') {
    return `${context}: Table not found in database`
  }

  // Auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password'
  }
  if (error.message?.includes('User not found')) {
    return 'User account not found'
  }
  if (error.message?.includes('Email not confirmed')) {
    return 'Please confirm your email before logging in'
  }

  // Default
  return `${context}: ${error.message || 'An error occurred'}`
}

/**
 * Configuration for client
 */
export const SupabaseConfig = {
  URL: SUPABASE_URL,
  isConfigured: !!SUPABASE_URL && !!SUPABASE_ANON_KEY,
  testConnection,
  formatError: formatSupabaseError
}

export default supabase