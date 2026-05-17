import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

// Admin email - must always be assigned admin role
const ADMIN_EMAIL = 'devr01499@gmail.com';

const sql = `
-- Backfill email and role from auth.users into public.users
UPDATE public.users AS u
SET 
  email = au.email,
  role = CASE WHEN au.email = '${ADMIN_EMAIL}' THEN 'admin' ELSE 'user' END
FROM auth.users AS au
WHERE u.id = au.id;

-- Insert admin user if they exist in auth.users but NOT in public.users
INSERT INTO public.users (id, email, role, company_name, created_at)
SELECT 
  au.id,
  au.email,
  'admin',
  COALESCE(au.raw_user_meta_data->>'company_name', 'Admin'),
  au.created_at
FROM auth.users au
WHERE au.email = '${ADMIN_EMAIL}'
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id)
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = 'admin';
`;

async function runBackfill() {
  const connectionString = (process.env.POSTGRES_URL || "").replace("sslmode=require", "sslmode=disable");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase for backfill...");
    await client.connect();
    console.log("Connected!");

    console.log("Backfilling emails and roles...");
    const result = await client.query(sql);
    console.log("Done! Rows updated.");

    // Verify
    const check = await client.query(`SELECT id, email, role FROM public.users ORDER BY created_at`);
    console.log("\nCurrent users table:");
    console.table(check.rows);

  } catch (err) {
    console.error("Backfill Error:", err);
  } finally {
    await client.end();
  }
}

runBackfill();
