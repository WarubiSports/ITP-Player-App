import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function inviteColin() {
  const email = 'colinsoccer18@gmail.com'
  console.log(`Inviting ${email}...\n`)

  // Try invite instead of create
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://itp-player-app.vercel.app/dashboard',
    data: {
      first_name: 'Colin',
      last_name: 'Dickinson'
    }
  })

  if (error) {
    console.error('Invite failed:', error.message)

    // Check if user might already exist
    const { data: users } = await supabase.auth.admin.listUsers()
    const existing = users?.users?.find(u => u.email === email)

    if (existing) {
      console.log('\nUser already exists in auth.users!')
      console.log(`User ID: ${existing.id}`)
      console.log(`Email confirmed: ${existing.email_confirmed_at ? 'Yes' : 'No'}`)

      // Try to generate a magic link for existing user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: 'https://itp-player-app.vercel.app/dashboard'
        }
      })

      if (linkError) {
        console.log('\nCannot generate magic link:', linkError.message)
      } else {
        console.log('\n========================================')
        console.log('MAGIC LINK GENERATED')
        console.log('========================================')
        console.log(linkData.properties?.action_link)
        console.log('========================================')

        // Try to ensure profile and player link exist
        await ensureProfileAndLink(existing.id, email)
      }
    }
    return
  }

  console.log('Invite sent successfully!')
  console.log('User ID:', data.user.id)
}

async function ensureProfileAndLink(userId: string, email: string) {
  // Check/create profile (service role bypasses RLS)
  const { data: profile, error: profileCheckError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileCheckError && profileCheckError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    console.log('\nCreating profile...')
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        first_name: 'Colin',
        last_name: 'Dickinson',
        role: 'player'
      })

    if (insertError) {
      console.error('Error creating profile:', insertError)
    } else {
      console.log('Profile created!')
    }
  } else if (profile) {
    console.log('\nProfile exists:', profile.email)
  }

  // Link player record
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, user_id')
    .eq('email', email.toLowerCase())
    .single()

  if (player) {
    if (player.user_id === userId) {
      console.log('Player already linked!')
    } else {
      // Link it
      const { error: linkError } = await supabase
        .from('players')
        .update({ user_id: userId })
        .eq('id', player.id)

      if (linkError) {
        console.error('Error linking player:', linkError)
      } else {
        console.log('Player linked to auth user!')
      }
    }
    console.log(`Player: ${player.first_name} ${player.last_name} (${player.id})`)
  }
}

inviteColin()
