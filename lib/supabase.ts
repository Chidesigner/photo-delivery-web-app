import { createClient } from "@supabase/supabase-js";

// 🔐 Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Supabase environment variables are missing.\n" +
      "Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
  );
}

// 🚀 Public client (browser-safe) with proper auth config and network resilience
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Prevents the refresh token error
    storageKey: 'photo-delivery-auth',
  },
  global: {
    headers: {
      'x-client-info': 'photo-delivery-app'
    },
    fetch: (url, options = {}) => {
      // Add request timeout of 15 seconds to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      })
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          // Check if it's a timeout
          if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your internet connection and try again.');
          }
          throw error;
        });
    }
  }
});