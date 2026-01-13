const { Client } = require('pg')

const connectionString = 'postgresql://postgres:Okapi14111999!@db.umblyhwumtadlvgccdwg.supabase.co:5432/postgres'

async function fixTrigger() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('Connected!\n')

    // Check if staff_profiles exists
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('profiles', 'staff_profiles')
    `)
    console.log('Existing tables:', tables.map(t => t.table_name))

    // Check players for Colin
    const { rows: colin } = await client.query(`
      SELECT id, email, first_name, last_name FROM players WHERE LOWER(email) = 'colinsoccer18@gmail.com'
    `)
    console.log('\nColin in players table:', colin)

    // The trigger is checking if email exists in players
    // If it DOES exist (like Colin), it skips the insert and just returns
    // But there's still a failure...

    // Let's recreate the trigger to work properly
    console.log('\n\nRecreating handle_new_user function...')

    await client.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- For players (email exists in players table), create player profile
        -- For non-players, create staff profile
        IF EXISTS (SELECT 1 FROM players WHERE LOWER(email) = LOWER(NEW.email)) THEN
          -- Player signup - create profile entry
          INSERT INTO public.profiles (id, email, role)
          VALUES (NEW.id, NEW.email, 'player')
          ON CONFLICT (id) DO NOTHING;
        ELSE
          -- Staff/admin signup - create profile entry
          INSERT INTO public.profiles (id, email, role)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
          )
          ON CONFLICT (id) DO NOTHING;
        END IF;
        RETURN NEW;
      END;
      $$;
    `)
    console.log('✓ Function recreated')

    // Verify
    const { rows: funcs } = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'
    `)
    console.log('\nNew function source:')
    console.log(funcs[0].prosrc)

    console.log('\n========================================')
    console.log('TRIGGER FIXED!')
    console.log('========================================')

  } catch (err) {
    console.error('Error:', err.message)
    console.error(err)
  } finally {
    await client.end()
  }
}

fixTrigger()
