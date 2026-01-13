import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixMissingProfiles() {
  console.log('Fixing missing profiles...\n')

  // First, create missing profile for th.el
  const thElId = '8283520d-4eaf-4c20-ab27-fedb01b1f279'
  const thElEmail = 'th.el@warubi-sports.com'

  const { error: thElError } = await supabase
    .from('profiles')
    .insert({
      id: thElId,
      email: thElEmail,
      role: 'staff'  // Warubi staff
    })

  if (thElError) {
    console.error('Error creating th.el profile:', thElError)
  } else {
    console.log('✓ Created profile for th.el@warubi-sports.com')
  }

  // Now try to pre-create Colin's profile BEFORE creating auth user
  // This might work if we can bypass the trigger's insert
  const colinEmail = 'colinsoccer18@gmail.com'

  // Check if profile already exists for this email (maybe orphaned)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', colinEmail)
    .single()

  if (existingProfile) {
    console.log('\nProfile already exists for Colin email!')
    console.log('ID:', existingProfile.id)

    // Check if there's an auth user with this ID
    const { data: users } = await supabase.auth.admin.listUsers()
    const authUser = users?.users?.find(u => u.id === existingProfile.id)

    if (authUser) {
      console.log('Auth user exists:', authUser.email)
    } else {
      console.log('No auth user for this profile - orphaned profile!')
      // Delete the orphaned profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', existingProfile.id)

      if (deleteError) {
        console.error('Error deleting orphaned profile:', deleteError)
      } else {
        console.log('Orphaned profile deleted')
      }
    }
  } else {
    console.log('\nNo existing profile for colinsoccer18@gmail.com')
  }

  // Check all profiles for any issues
  console.log('\n\nAll profiles:')
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')

  for (const p of allProfiles || []) {
    console.log(`- ${p.email} (${p.role}) - ID: ${p.id}`)
  }
}

fixMissingProfiles()
