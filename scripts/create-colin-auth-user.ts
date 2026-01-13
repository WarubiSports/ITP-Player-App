import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createColinAuthUser() {
  console.log('Creating Colin Dickinson auth user...\n')

  const email = 'colinsoccer18@gmail.com'

  // Check if auth user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === email)

  if (existingUser) {
    console.log('Auth user already exists!')
    console.log(`User ID: ${existingUser.id}`)

    // Just make sure profile and player are linked
    await linkProfileAndPlayer(existingUser.id, email)
    return
  }

  // Create auth user with the Admin API (bypasses triggers)
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      first_name: 'Colin',
      last_name: 'Dickinson'
    }
  })

  if (createError) {
    console.error('Error creating auth user:', createError)
    return
  }

  console.log('Auth user created!')
  console.log(`User ID: ${newUser.user.id}`)

  await linkProfileAndPlayer(newUser.user.id, email)
}

async function linkProfileAndPlayer(userId: string, email: string) {
  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    // Create profile manually (service role bypasses RLS)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        first_name: 'Colin',
        last_name: 'Dickinson',
        role: 'player'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    } else {
      console.log('Profile created!')
    }
  } else {
    console.log('Profile already exists!')
  }

  // Link player record to this auth user
  const { data: player, error: playerError } = await supabase
    .from('players')
    .update({ user_id: userId })
    .eq('email', email.toLowerCase())
    .select()
    .single()

  if (playerError) {
    console.error('Error linking player:', playerError)
  } else if (player) {
    console.log('Player linked!')
    console.log(`Player ID: ${player.id}`)
    console.log(`Name: ${player.first_name} ${player.last_name}`)
  }

  // Generate a magic link for Colin to use
  const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: 'https://itp-player-app.vercel.app/dashboard'
    }
  })

  if (linkError) {
    console.error('Error generating magic link:', linkError)
  } else {
    console.log('\n========================================')
    console.log('COLIN DICKINSON - LOGIN READY')
    console.log('========================================')
    console.log(`Email: ${email}`)
    console.log('\nMagic Link (one-time use):')
    console.log(magicLink.properties?.action_link)
    console.log('========================================')
  }
}

createColinAuthUser()
