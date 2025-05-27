import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with correct configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable auto refresh token
    autoRefreshToken: true,
    // Do not persist session in local storage
    // persistSession: false, // removed
    // Detect session changes
    detectSessionInUrl: true
  }
})

// Site URL for redirects
export const siteUrl = 'http://localhost:5173/'