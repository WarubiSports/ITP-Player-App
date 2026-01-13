import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixProfilesRLS() {
  console.log('Fixing profiles RLS policy...\n')

  // The handle_new_user trigger runs as SECURITY DEFINER
  // But we need to ensure the function bypasses RLS
  // Let's update the function to use SET search_path and bypass RLS

  const fixTriggerSQL = `
    -- Drop and recreate the trigger function with proper RLS bypass
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
        INSERT INTO public.profiles (id, email, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'role', 'player')
        )
        ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate errors
        RETURN NEW;
    END;
    $$;

    -- Grant necessary permissions
    ALTER FUNCTION handle_new_user() OWNER TO postgres;
  `

  // Try using rpc to run raw SQL (if available)
  const { error } = await supabase.rpc('exec_sql', { sql: fixTriggerSQL })

  if (error) {
    console.log('Cannot run SQL via RPC (expected):', error.message)
    console.log('\n========================================')
    console.log('MANUAL FIX REQUIRED IN SUPABASE DASHBOARD')
    console.log('========================================')
    console.log('\n1. Go to: https://supabase.com/dashboard/project/umblyhwumtadlvgccdwg')
    console.log('2. Click "SQL Editor" in the left sidebar')
    console.log('3. Run this SQL:\n')
    console.log(`
-- Option 1: Add a policy allowing the trigger to insert
CREATE POLICY "Allow trigger to insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- Or Option 2: Disable RLS on profiles temporarily
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    `)
    console.log('\n4. After running, try the magic link again')
    console.log('========================================')
  } else {
    console.log('SQL executed successfully!')
  }
}

fixProfilesRLS()
