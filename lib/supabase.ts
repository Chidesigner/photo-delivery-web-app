import { createClient } from "@supabase/supabase-js"

// 🔐 Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Supabase environment variables are missing.\n" +
    "Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
  )
}

// 🚀 Public client (browser-safe)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
