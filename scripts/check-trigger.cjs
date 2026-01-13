const { Client } = require('pg')

const connectionString = 'postgresql://postgres:Okapi14111999!@db.umblyhwumtadlvgccdwg.supabase.co:5432/postgres'

async function checkTrigger() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('Connected!\n')

    // Check the trigger function
    console.log('Checking handle_new_user function...')
    const { rows: funcs } = await client.query(`
      SELECT prosrc, prosecdef
      FROM pg_proc
      WHERE proname = 'handle_new_user'
    `)

    if (funcs.length > 0) {
      console.log('Function found:')
      console.log('Security definer:', funcs[0].prosecdef)
      console.log('Source:\n', funcs[0].prosrc)
    } else {
      console.log('Function NOT FOUND')
    }

    // Check trigger
    console.log('\n\nChecking trigger on auth.users...')
    const { rows: triggers } = await client.query(`
      SELECT tgname, tgtype, tgenabled
      FROM pg_trigger
      WHERE tgrelid = 'auth.users'::regclass
    `)

    console.log('Triggers:', triggers)

    // Check if profiles table exists and its structure
    console.log('\n\nChecking profiles table...')
    const { rows: cols } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position
    `)

    console.log('Columns:')
    for (const col of cols) {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    }

    // Check constraints
    console.log('\n\nChecking constraints...')
    const { rows: constraints } = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'public.profiles'::regclass
    `)

    for (const c of constraints) {
      console.log(`- ${c.conname} (${c.contype}): ${c.pg_get_constraintdef}`)
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
  }
}

checkTrigger()
