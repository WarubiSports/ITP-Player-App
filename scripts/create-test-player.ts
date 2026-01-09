import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEST_EMAIL = 'test.player@itpkoeln.com'
const TEST_PASSWORD = 'TestPlayer123!'

async function createTestPlayer() {
  console.log('Creating test player account...\n')

  // First, find a player with a photo to link to
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, first_name, last_name, photo_url')
    .eq('last_name', 'Dickinson')
    .single()

  if (playerError || !player) {
    console.error('Could not find player:', playerError)
    return
  }

  console.log(`Found player: ${player.first_name} ${player.last_name}`)
  console.log(`Photo URL: ${player.photo_url ? 'Yes' : 'No'}\n`)

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === TEST_EMAIL)

  if (existingUser) {
    console.log('Test user already exists, updating password...')

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      { password: TEST_PASSWORD }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return
    }

    // Update player to link to this user
    await supabase
      .from('players')
      .update({ user_id: existingUser.id })
      .eq('id', player.id)

    console.log('\n✓ Test player account ready!')
  } else {
    // Create new auth user
    console.log('Creating new auth user...')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: player.first_name,
        last_name: player.last_name,
        role: 'player'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created:', authData.user.id)

    // Link player to auth user
    const { error: linkError } = await supabase
      .from('players')
      .update({ user_id: authData.user.id })
      .eq('id', player.id)

    if (linkError) {
      console.error('Error linking player:', linkError)
      return
    }

    console.log('\n✓ Test player account created!')
  }

  console.log('\n========================================')
  console.log('TEST PLAYER LOGIN CREDENTIALS')
  console.log('========================================')
  console.log(`Email:    ${TEST_EMAIL}`)
  console.log(`Password: ${TEST_PASSWORD}`)
  console.log(`Player:   ${player.first_name} ${player.last_name}`)
  console.log('========================================')
  console.log('\nGo to: https://itp-player-app.vercel.app/login')
}

createTestPlayer()
