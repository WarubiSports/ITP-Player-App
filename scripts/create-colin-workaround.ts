import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Use Supabase REST API directly to run SQL
async function runSQL(sql: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  })

  return response
}

async function createColinWorkaround() {
  const email = 'colinsoccer18@gmail.com'
  console.log('Attempting workaround for Colin...\n')

  // Step 1: Check if we can use the SQL API
  // First try to drop the trigger temporarily
  console.log('Attempting to modify trigger via SQL...')

  // This probably won't work but let's try
  try {
    // Can we use raw PostgreSQL via pg?
    // Not without pg library and direct connection string
    console.log('Direct SQL not available via REST API')
  } catch (e) {
    console.log('Expected: cannot run arbitrary SQL')
  }

  // Step 2: Alternative - use password-based signup with auto-confirm
  console.log('\nTrying password-based user creation with metadata...')

  // Generate a random password
  const tempPassword = 'TempPass!' + Math.random().toString(36).slice(2, 10)

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: 'Colin',
      last_name: 'Dickinson',
      player: true
    }
  })

  if (createError) {
    console.error('Create user failed:', createError.message)

    console.log('\n========================================')
    console.log('MANUAL FIX REQUIRED')
    console.log('========================================')
    console.log('\nThe database trigger "handle_new_user" is failing.')
    console.log('You need to go to Supabase Dashboard and run this SQL:\n')
    console.log(`
-- Fix 1: Drop the problematic INSERT policy and create a permissive one
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Anyone can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- Then try creating the user again via the Player App login page
    `)
    console.log('\nDashboard URL: https://supabase.com/dashboard/project/umblyhwumtadlvgccdwg/sql')
    console.log('========================================')
    return
  }

  console.log('User created successfully!')
  console.log(`User ID: ${newUser.user.id}`)
  console.log(`Temp Password: ${tempPassword}`)

  // Now create profile and link player
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: newUser.user.id,
      email: email,
      first_name: 'Colin',
      last_name: 'Dickinson',
      role: 'player'
    })

  if (profileError) {
    console.error('Profile error:', profileError)
  } else {
    console.log('Profile created/updated!')
  }

  // Link player
  const { data: player } = await supabase
    .from('players')
    .update({ user_id: newUser.user.id })
    .eq('email', email.toLowerCase())
    .select()
    .single()

  if (player) {
    console.log(`Player linked: ${player.first_name} ${player.last_name}`)
  }

  // Generate magic link
  const { data: link } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: { redirectTo: 'https://itp-player-app.vercel.app/dashboard' }
  })

  console.log('\n========================================')
  console.log('COLIN DICKINSON - READY')
  console.log('========================================')
  console.log(`Email: ${email}`)
  console.log(`Temp Password: ${tempPassword}`)
  console.log(`\nMagic Link:\n${link?.properties?.action_link}`)
  console.log('========================================')
}

createColinWorkaround()
