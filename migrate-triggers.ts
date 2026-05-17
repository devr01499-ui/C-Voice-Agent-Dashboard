import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

const sql = `
-- 1. Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  company TEXT;
BEGIN
  -- Determine role securely on the backend
  IF NEW.email = 'devr01499@gmail.com' THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  -- Attempt to extract company name from metadata if available, otherwise default
  company := COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company');

  -- Safely insert the new profile, ignoring if it already exists to prevent duplicate failures
  INSERT INTO public.users (id, email, role, company_name, created_at)
  VALUES (NEW.id, NEW.email, assigned_role, company, NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Log the creation attempt securely
  INSERT INTO public.system_logs (event, status, details)
  VALUES ('USER_CREATED_TRIGGER', 'SUCCESS', jsonb_build_object('user_id', NEW.id, 'email', NEW.email, 'assigned_role', assigned_role));

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, log it but don't break the auth flow completely
    INSERT INTO public.system_logs (event, status, error_message)
    VALUES ('USER_CREATED_TRIGGER_FAILED', 'FAILED', SQLERRM);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it exists, then recreate it on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_call_reports_campaign_id ON public.call_reports(campaign_id);
`;

async function runMigration() {
  const connectionString = (process.env.POSTGRES_URL || "").replace("sslmode=require", "sslmode=disable");

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase Database for Trigger Setup...");
    await client.connect();
    console.log("Connected successfully!");

    console.log("Running Trigger SQL...");
    await client.query(sql);
    console.log("Database triggers successfully established.");

  } catch (err) {
    console.error("Database Migration Error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
