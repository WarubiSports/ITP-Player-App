import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAuthUsers() {
  console.log('Checking auth.users...\n')

  const { data: users, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${users.users.length} auth users:\n`)

  for (const user of users.users) {
    console.log(`- ${user.email}`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`  Created: ${user.created_at}`)
    console.log('')
  }

  // Check profiles table
  console.log('\nChecking profiles table...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')

  if (profilesError) {
    console.error('Profiles error:', profilesError)
  } else {
    console.log(`Found ${profiles.length} profiles:\n`)
    for (const p of profiles) {
      console.log(`- ${p.email} (${p.role})`)
      console.log(`  ID: ${p.id}`)
    }
  }

  // Check if any users DON'T have profiles (trigger might have failed)
  console.log('\n\nUsers missing profiles:')
  for (const user of users.users) {
    const hasProfile = profiles?.some(p => p.id === user.id)
    if (!hasProfile) {
      console.log(`- ${user.email} (${user.id}) - MISSING PROFILE`)
    }
  }
}

checkAuthUsers()
