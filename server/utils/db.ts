import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key if available for backend admin tasks, else fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing Supabase environment variables in backend.");
}

export const supabase = createClient(supabaseUrl as string, supabaseKey as string);

export const logSystemEvent = async (userId: string | null, event: string, status: string, errorMessage: string | null = null, details: any = null) => {
  try {
    await supabase.from('system_logs').insert({
      user_id: userId,
      event,
      status,
      error_message: errorMessage,
      details
    });
  } catch (error) {
    console.error("Failed to write to system_logs:", error);
  }
};
