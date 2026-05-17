import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Client } = pg;

const sql = `
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can read all users" ON users;
    DROP POLICY IF EXISTS "Admins can view all logs" ON system_logs;
END $$;
`;

async function runMigration() {
  const connectionString = (process.env.POSTGRES_URL || "").replace("sslmode=require", "sslmode=disable");

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase Database for RLS Fix...");
    await client.connect();
    console.log("Connected successfully!");

    console.log("Running SQL to drop recursive policies...");
    await client.query(sql);
    console.log("Policies successfully dropped.");

  } catch (err) {
    console.error("Database Migration Error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
