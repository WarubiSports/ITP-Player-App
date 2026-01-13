const { Client } = require('pg')

const connectionString = 'postgresql://postgres:Okapi14111999!@db.umblyhwumtadlvgccdwg.supabase.co:5432/postgres'

async function fixRLS() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    console.log('Connecting to database...')
    await client.connect()
    console.log('Connected!\n')

    // Fix the profiles INSERT policy
    console.log('Fixing profiles RLS policy...')

    await client.query(`
      DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
    `)
    console.log('✓ Dropped old restrictive policy')

    await client.query(`
      CREATE POLICY "Allow profile creation"
        ON public.profiles FOR INSERT
        WITH CHECK (true);
    `)
    console.log('✓ Created new permissive INSERT policy')

    // Verify
    const { rows } = await client.query(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'profiles'
    `)

    console.log('\nCurrent profiles policies:')
    for (const row of rows) {
      console.log(`- ${row.policyname} (${row.cmd})`)
    }

    console.log('\n========================================')
    console.log('RLS POLICY FIXED!')
    console.log('Magic link signup should now work.')
    console.log('========================================')

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

fixRLS()
