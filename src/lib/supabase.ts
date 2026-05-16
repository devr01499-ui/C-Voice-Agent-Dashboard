import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.PROD) {
    throw new Error(
      "Missing Supabase credentials! VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in production."
    );
  } else {
    console.warn(
      "Supabase credentials missing. Client initialized with placeholders. Check your .env file."
    );
  }
}

// Create single supabase client for interaction with your database
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
