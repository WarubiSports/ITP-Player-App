const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://umblyhwumtadlvgccdwg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmx5aHd1bXRhZGx2Z2NjZHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDQ3MDAsImV4cCI6MjA4MjQ4MDcwMH0.CwEeOHFU_DCecQHCxLXrHpToDNf3XEkbqIpqdNeJZxY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteDemoEvents() {
    console.log('Fetching events from Supabase...')

    // First, get all events to see what we're dealing with
    const { data: events, error: fetchError } = await supabase
        .from('events')
        .select('*')

    if (fetchError) {
        console.error('Error fetching events:', fetchError)
    } else {
        console.log(`Found ${events?.length || 0} events in Supabase`)
        events?.forEach(e => console.log(`  - ${e.id}: ${e.title} (${e.date || e.start_time})`))
    }

    if (events && events.length > 0) {
        // Delete all events
        console.log('\nDeleting all events from Supabase...')
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) {
            console.error('Error deleting events:', deleteError)
        } else {
            console.log('All Supabase events deleted!')
        }
    }

    console.log('\n===========================================')
    console.log('IMPORTANT: The demo events are stored in your browser\'s localStorage!')
    console.log('To clear them, open your browser DevTools (F12) and run:')
    console.log('')
    console.log('  localStorage.removeItem("demo_events")')
    console.log('  localStorage.removeItem("demo_data_version")')
    console.log('  location.reload()')
    console.log('')
    console.log('Or clear all demo data:')
    console.log('  Object.keys(localStorage).filter(k => k.startsWith("demo_")).forEach(k => localStorage.removeItem(k))')
    console.log('  location.reload()')
    console.log('===========================================')
}

deleteDemoEvents()
