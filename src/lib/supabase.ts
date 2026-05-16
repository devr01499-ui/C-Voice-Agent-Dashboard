import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase credentials missing! Please ensure VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is set."
  );
}

// Create single supabase client for interaction with your database
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
