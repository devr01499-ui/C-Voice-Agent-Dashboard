import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

const sql = `
-- 1. Safely rename 'profiles' to 'users' if it hasn't been renamed yet
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        ALTER TABLE profiles RENAME TO users;
    END IF;
END $$;

-- Add new columns to 'users' table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS sheet_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Remove old columns from 'users' if not needed? We will keep them for safety
-- (e.g. logo_url, webhook_url are kept)

-- 2. Safely add columns to 'campaigns' table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='name') THEN
        ALTER TABLE campaigns RENAME COLUMN name TO campaign_name;
    END IF;
END $$;

-- 3. Safely rename 'reports' to 'call_reports'
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reports') THEN
        ALTER TABLE reports RENAME TO call_reports;
    END IF;
END $$;

-- Add new columns to 'call_reports' table
ALTER TABLE call_reports ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE;
-- 'candidate_name', 'phone_number', 'job_role', 'status', 'duration', 'cost', 'feedback', 'created_at' already exist or we rename:

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_reports' AND column_name='phone_number') THEN
        ALTER TABLE call_reports RENAME COLUMN phone_number TO phone;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_reports' AND column_name='job_role') THEN
        ALTER TABLE call_reports RENAME COLUMN job_role TO role;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='call_reports' AND column_name='status') THEN
        ALTER TABLE call_reports RENAME COLUMN status TO result;
    END IF;
END $$;

ALTER TABLE call_reports ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE call_reports ADD COLUMN IF NOT EXISTS call_status TEXT;
ALTER TABLE call_reports ADD COLUMN IF NOT EXISTS retell_call_id TEXT;
ALTER TABLE call_reports ADD COLUMN IF NOT EXISTS workflow_id TEXT;

-- 4. Create 'candidates' table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  candidate_name TEXT,
  phone TEXT,
  role TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create 'system_logs' (formerly webhook_logs) table
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  event TEXT,
  status TEXT,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- campaigns and call_reports already have it from previous script.

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_campaign_id ON candidates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_reports_campaign_id ON call_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- POLICIES FOR USERS (Admin vs User)
DO $$ 
BEGIN
    -- Drop old policies on profiles (which is now users)
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON users;
    
    -- Users can read their own
    CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
    
    -- Admins read all via Service Role on backend, so we DO NOT create an RLS policy for admins here
    -- to prevent infinite recursion on the users table.
    
    -- Users can insert own
    CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);
    -- Users can update own non-role fields. But RLS can't easily restrict column updates without triggers. We will rely on Backend APIs.
    CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
    
    -- Candidates
    CREATE POLICY "Users can read own candidates" ON candidates FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own candidates" ON candidates FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own candidates" ON candidates FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own candidates" ON candidates FOR DELETE USING (auth.uid() = user_id);

    -- System Logs
    CREATE POLICY "Users can view own logs" ON system_logs FOR SELECT USING (auth.uid() = user_id);
    
    -- Again, no admin RLS for system_logs since admins fetch via backend.
END $$;
`;

async function runMigration() {
  const connectionString = (process.env.POSTGRES_URL || "").replace("sslmode=require", "sslmode=disable");

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("Connecting to Supabase Database for Migration...");
    await client.connect();
    console.log("Connected successfully!");

    console.log("Running SQL Schema Migration...");
    await client.query(sql);
    console.log("Database schema successfully migrated.");

  } catch (err) {
    console.error("Database Migration Error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
