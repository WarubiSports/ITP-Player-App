import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkwNDcwMCwiZXhwIjoyMDgyNDgwNzAwfQ.wpu0zKxWtEG5e2hyeWub0Zwt8uRQUhXFYNhpqkRr4RI'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function restoreColinDickinson() {
  console.log('Restoring Colin Dickinson player profile...\n')

  // First check if player already exists
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('first_name', 'Colin')
    .eq('last_name', 'Dickinson')
    .single()

  if (existingPlayer) {
    console.log('Colin Dickinson already exists in database!')
    console.log(`Player ID: ${existingPlayer.id}`)
    return
  }

  // Get a house to assign (first available)
  const { data: houses } = await supabase
    .from('houses')
    .select('id, name')
    .limit(1)

  const houseId = houses?.[0]?.id || null
  console.log(`Assigning to house: ${houses?.[0]?.name || 'None'}`)

  // Get valid positions from existing players
  const { data: existingPositions } = await supabase
    .from('players')
    .select('position')
    .not('position', 'is', null)
    .limit(1)

  console.log('Sample position from DB:', existingPositions?.[0]?.position)

  // Create the player
  const playerData = {
    first_name: 'Colin',
    last_name: 'Dickinson',
    position: existingPositions?.[0]?.position || null,
    house_id: houseId,
    status: 'active',
    date_of_birth: '2006-11-18',
    nationality: 'USA',
    points: 450,
    photo_url: null
  }

  const { data: newPlayer, error: insertError } = await supabase
    .from('players')
    .insert([playerData])
    .select()
    .single()

  if (insertError) {
    console.error('Error creating player:', insertError)
    return
  }

  console.log('\n========================================')
  console.log('COLIN DICKINSON RESTORED')
  console.log('========================================')
  console.log(`Player ID: ${newPlayer.id}`)
  console.log(`Name: ${newPlayer.first_name} ${newPlayer.last_name}`)
  console.log(`Position: ${newPlayer.position}`)
  console.log(`DOB: ${newPlayer.date_of_birth}`)
  console.log(`Nationality: ${newPlayer.nationality}`)
  console.log(`Points: ${newPlayer.points}`)
  console.log('========================================')
  console.log('\nNote: To create login credentials, run create-test-player.ts')
}

restoreColinDickinson()
