import { createClient } from '@supabase/supabase-js'

// Trim env vars to handle any whitespace/newline issues from Vercel
const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseUrl = rawUrl.trim() || 'https://placeholder.supabase.co'
const supabaseAnonKey = rawKey.trim() || 'placeholder-key'

// Check if Supabase is properly configured (not using placeholder)
const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('https://')
)

// Debug: Log configuration status (remove in production if too verbose)
console.log('[Supabase] Config check:', {
    hasUrl: !!rawUrl,
    hasKey: !!rawKey,
    urlLength: rawUrl.length,
    trimmedUrlLength: supabaseUrl.length,
    isConfigured: isSupabaseConfigured,
    urlStart: supabaseUrl.substring(0, 30)
})


export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Connection health state
let connectionHealthy = null // null = untested, true = healthy, false = unhealthy
let lastHealthCheck = 0
const HEALTH_CHECK_INTERVAL = 60000 // Re-check every 60 seconds

// Test Supabase connection health with timeout
export const checkConnection = async () => {
    // Skip if not configured
    if (!isSupabaseConfigured) {
        connectionHealthy = false
        return false
    }

    // Use cached result if recent
    const now = Date.now()
    if (connectionHealthy !== null && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
        return connectionHealthy
    }

    try {
        // Simple health check with 5 second timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
        const queryPromise = supabase.from('houses').select('id').limit(1)

        const { error } = await Promise.race([queryPromise, timeoutPromise])
        connectionHealthy = !error
        lastHealthCheck = now

        if (!connectionHealthy) {
            console.log('Supabase connection unhealthy, using demo mode')
        }

        return connectionHealthy
    } catch (error) {
        connectionHealthy = false
        lastHealthCheck = now
        console.log('Supabase connection failed or timed out, using demo mode')
        return false
    }
}

// Get connection status (sync)
export const isConnectionHealthy = () => {
    return connectionHealthy === true
}

// Demo mode check - evaluated at runtime each time it's accessed
// True when: no Supabase URL configured OR user logged in via demo login OR connection unhealthy
export const checkIsDemoMode = () => {
    return !isSupabaseConfigured ||
           localStorage.getItem('itp_demo_user') !== null ||
           connectionHealthy === false
}

// Check if we should use demo DATA
// True when: no Supabase URL configured OR user logged in via demo login OR connection unhealthy
// Demo users have non-UUID IDs that won't work with Supabase, so we must use local storage
export const shouldUseDemoData = () => {
    return !isSupabaseConfigured ||
           localStorage.getItem('itp_demo_user') !== null ||
           connectionHealthy === false
}

// For backwards compatibility - but prefer checkIsDemoMode() for runtime checks
export const isDemoMode = checkIsDemoMode()

// Demo data version - increment this when you change demo data structure
const DEMO_DATA_VERSION = 8

// Initialize demo data on first load or when version changes
const initializeDemoData = () => {
    const currentVersion = localStorage.getItem('demo_data_version')

    if (currentVersion !== String(DEMO_DATA_VERSION)) {
        // Clear old demo data and reset with new version
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('demo_')) {
                localStorage.removeItem(key)
            }
        })
        localStorage.setItem('demo_data_version', String(DEMO_DATA_VERSION))
    }
}

// Helper functions for demo mode (deprecated - use data-service.js instead)
export const getDemoData = () => {
    const stored = {}
    Object.keys(demoData).forEach(key => {
        const item = localStorage.getItem(`demo_${key}`)
        stored[key] = item ? JSON.parse(item) : demoData[key]
    })
    return stored
}

export const updateDemoData = (key, value) => {
    localStorage.setItem(`demo_${key}`, JSON.stringify(value))
}

// Demo data for when Supabase is not configured
export const demoData = {
    users: [
        { id: 'admin-1', email: 'max.bisinger@warubi-sports.com', role: 'admin', first_name: 'Max', last_name: 'Bisinger' },
        { id: 'staff-1', email: 'thomas.ellinger@warubi-sports.com', role: 'staff', first_name: 'Thomas', last_name: 'Ellinger' },
        // Player user accounts (so players can log in and test features)
        { id: 'p1', email: 'colin.dickinson@itp.com', role: 'player', first_name: 'Colin', last_name: 'Dickinson' },
        { id: 'p2', email: 'jalen.robertson@itp.com', role: 'player', first_name: 'Jalen', last_name: 'Robertson' },
        // Generic demo player account
        { id: 'p1', email: 'demo.player@itp.com', role: 'player', first_name: 'Demo', last_name: 'Player' },
    ],
    players: [
        // Widdersdorf 1 - 7 players
        { id: 'p1', user_id: 'p1', first_name: 'Colin', last_name: 'Dickinson', position: 'DEF/MID', house_id: 'h1', status: 'active', date_of_birth: '2006-11-18', nationality: 'USA', points: 450 },
        { id: 'p2', user_id: 'p2', first_name: 'Jalen', last_name: 'Robertson', position: 'FWD/MID', house_id: 'h1', status: 'active', date_of_birth: '2006-03-14', nationality: 'USA', points: 420 },
        { id: 'p3', first_name: 'Omar', last_name: 'Gagula', position: 'MID/FWD', house_id: 'h1', status: 'active', date_of_birth: '2006-07-11', nationality: 'Bosnia', points: 380 },
        { id: 'p4', first_name: 'Marwan', last_name: 'Kouyate', position: 'CF', house_id: 'h1', status: 'active', date_of_birth: '2006-06-02', nationality: 'USA', points: 410 },
        { id: 'p5', first_name: 'Samuel', last_name: 'Rincon', position: 'DEF/MID', house_id: 'h1', status: 'active', date_of_birth: '2006-12-24', nationality: 'USA', points: 365 },
        { id: 'p6', first_name: 'Conor', last_name: 'Kasewurm', position: 'MID', house_id: 'h1', status: 'active', date_of_birth: '2006-04-18', nationality: 'USA', points: 340 },
        { id: 'p7', first_name: 'Noah', last_name: 'Clarkson-Hall', position: 'GK', house_id: 'h1', status: 'active', date_of_birth: '2006-12-21', nationality: 'UK', points: 355 },
        // Widdersdorf 2 - 7 players
        { id: 'p8', first_name: 'AbdulRahman', last_name: 'Haruna', position: 'MID/FWD', house_id: 'h2', status: 'active', date_of_birth: '2009-03-19', nationality: 'USA', points: 320 },
        { id: 'p9', first_name: 'Hartej', last_name: 'Parmar', position: 'MID', house_id: 'h2', status: 'active', date_of_birth: '2009-07-05', nationality: 'Canada', points: 295 },
        { id: 'p10', first_name: 'Rylan', last_name: 'Douglas', position: 'MID', house_id: 'h2', status: 'active', date_of_birth: '2007-10-03', nationality: 'USA', points: 375 },
        { id: 'p11', first_name: 'Ashton', last_name: 'Tryon', position: 'MID', house_id: 'h2', status: 'active', date_of_birth: '2008-03-06', nationality: 'USA', points: 345 },
        { id: 'p12', first_name: 'William', last_name: 'Way', position: 'DEF/CB', house_id: 'h2', status: 'active', date_of_birth: '2008-03-03', nationality: 'USA', points: 360 },
        { id: 'p13', first_name: 'Saidjamolkhon', last_name: 'Saidakbarov', position: 'MID/FWD', house_id: 'h2', status: 'active', date_of_birth: '2007-08-03', nationality: 'Uzbekistan', points: 385 },
        { id: 'p14', first_name: 'Stefan', last_name: 'Gruskiewicz', position: 'LB', house_id: 'h2', status: 'active', date_of_birth: '2007-08-09', nationality: 'USA/Thailand', points: 350 },
        // Widdersdorf 3 - 7 players
        { id: 'p15', first_name: 'Samuel', last_name: 'Winkel', position: 'FWD/RW', house_id: 'h3', status: 'active', date_of_birth: '2009-03-31', nationality: 'USA/Mexico', points: 310 },
        { id: 'p16', first_name: 'Jordan', last_name: 'Gisa Mugisha', position: 'MID', house_id: 'h3', status: 'active', date_of_birth: '2002-01-21', nationality: 'Rwanda', points: 440 },
        { id: 'p17', first_name: 'Patrick', last_name: 'Revel', position: 'LB/CB', house_id: 'h3', status: 'active', date_of_birth: '2007-11-29', nationality: 'USA', points: 335 },
        { id: 'p18', first_name: 'Lucas', last_name: 'Vinson', position: 'MID/FWD', house_id: 'h3', status: 'active', date_of_birth: '2008-07-25', nationality: 'USA', points: 325 },
        { id: 'p19', first_name: 'Karan', last_name: 'Rao', position: 'DEF/LB', house_id: 'h3', status: 'active', date_of_birth: '2008-09-13', nationality: 'India', points: 300 },
        { id: 'p20', first_name: 'Santiago', last_name: 'Quevedo', position: 'MID', house_id: 'h3', status: 'active', date_of_birth: '2007-05-04', nationality: 'Peru', points: 370 },
        { id: 'p21', first_name: 'Julian', last_name: 'Quirk', position: 'GK', house_id: 'h3', status: 'active', date_of_birth: '2007-05-02', nationality: 'USA', points: 345 },
        // Pending players (arriving soon)
        { id: 'p22', first_name: 'Alexander', last_name: 'Linza', position: 'LB/DEF', house_id: null, status: 'pending', date_of_birth: '2007-01-16', nationality: 'USA', points: 0, arrival_date: '2026-01-26' },
        { id: 'p23', first_name: 'Collin', last_name: 'Middleton', position: 'LB/DEF', house_id: null, status: 'pending', date_of_birth: '2006-01-31', nationality: 'USA', points: 0, arrival_date: '2026-01-26' },
        { id: 'p24', first_name: 'Bhanu', last_name: 'Teja', position: 'DEF', house_id: null, status: 'pending', date_of_birth: '2009-03-17', nationality: 'India', points: 0, arrival_date: '2026-01-26' },
        { id: 'p25', first_name: 'Nathaniel', last_name: 'Przez', position: 'MID/FWD', house_id: null, status: 'pending', date_of_birth: '2010-05-07', nationality: 'USA', points: 0, arrival_date: '2026-07-26' },
    ],
    houses: [
        { id: 'h1', name: 'Widdersdorf 1', total_points: 2720 },
        { id: 'h2', name: 'Widdersdorf 2', total_points: 2430 },
        { id: 'h3', name: 'Widdersdorf 3', total_points: 2425 },
    ],
    chores: [
        { id: 'ch1', title: 'Kitchen Deep Clean', description: 'Deep clean kitchen including appliances, counters, and floors', priority: 'high', house_id: 'h1', assigned_to: 'p1', status: 'pending', points: 25, deadline: '2026-01-10', requires_photo: true },
        { id: 'ch2', title: 'Garden Maintenance', description: 'Trim hedges and water plants in front garden', priority: 'medium', house_id: 'h2', assigned_to: 'p8', status: 'pending', points: 15, deadline: '2026-01-11', requires_photo: true },
        { id: 'ch3', title: 'Common Room Organization', description: 'Organize books, games, and furniture in the common room', priority: 'low', house_id: 'h3', assigned_to: 'p15', status: 'pending', points: 10, deadline: '2026-01-12', requires_photo: false },
        { id: 'ch4', title: 'Laundry Room Clean', description: 'Clean washing machines, dryers, and organize supplies', priority: 'medium', house_id: 'h1', assigned_to: 'p2', status: 'approved', points: 20, deadline: '2026-01-09', completed_at: '2026-01-08', approved_at: '2026-01-08', requires_photo: true },
        { id: 'ch5', title: 'Bathroom Cleaning', description: 'Clean all bathrooms including toilets, showers, and mirrors', priority: 'high', house_id: 'h2', assigned_to: 'p10', status: 'pending', points: 20, deadline: '2026-01-10', requires_photo: true },
        { id: 'ch6', title: 'Trash & Recycling', description: 'Take out trash and organize recycling bins', priority: 'medium', house_id: 'h3', assigned_to: 'p17', status: 'pending', points: 10, deadline: '2026-01-09', requires_photo: false },
    ],
    // Chore templates for auto-rotation
    choreTemplates: [
        { id: 'ct1', title: 'Kitchen Deep Clean', description: 'Deep clean kitchen including appliances, counters, and floors', priority: 'high', points: 25, requires_photo: true, frequency: 'weekly', day_of_week: 0 },
        { id: 'ct2', title: 'Bathroom Cleaning', description: 'Clean all bathrooms including toilets, showers, and mirrors', priority: 'high', points: 20, requires_photo: true, frequency: 'weekly', day_of_week: 0 },
        { id: 'ct3', title: 'Trash & Recycling', description: 'Take out trash and organize recycling bins', priority: 'medium', points: 10, requires_photo: false, frequency: 'weekly', day_of_week: 3 },
        { id: 'ct4', title: 'Common Area Tidy', description: 'Vacuum and tidy the common living areas', priority: 'medium', points: 15, requires_photo: true, frequency: 'weekly', day_of_week: 5 },
        { id: 'ct5', title: 'Laundry Room Clean', description: 'Clean washing machines, dryers, and organize supplies', priority: 'medium', points: 20, requires_photo: true, frequency: 'weekly', day_of_week: 6 },
    ],
    // Rotation tracking per house
    choreRotations: [
        { id: 'cr1', house_id: 'h1', template_id: 'ct1', current_player_index: 0, last_rotated: '2026-01-06' },
        { id: 'cr2', house_id: 'h1', template_id: 'ct2', current_player_index: 1, last_rotated: '2026-01-06' },
        { id: 'cr3', house_id: 'h1', template_id: 'ct3', current_player_index: 2, last_rotated: '2026-01-06' },
        { id: 'cr4', house_id: 'h2', template_id: 'ct1', current_player_index: 0, last_rotated: '2026-01-06' },
        { id: 'cr5', house_id: 'h2', template_id: 'ct2', current_player_index: 1, last_rotated: '2026-01-06' },
        { id: 'cr6', house_id: 'h3', template_id: 'ct1', current_player_index: 0, last_rotated: '2026-01-06' },
    ],
    // Photo verifications (temporary storage until approved)
    chorePhotos: [],
    events: [
        // Monday - Typical ITP day
        { id: 'e1', title: 'Team Training', type: 'training', date: '2026-01-06', start_time: '09:30', end_time: '11:30', location: 'FC Köln Training Ground' },
        { id: 'e2', title: 'German Class - Level A2', type: 'german_class', date: '2026-01-06', start_time: '14:00', end_time: '16:00', location: 'Cologne Language Center' },
        // Tuesday
        { id: 'e3', title: 'Team Training', type: 'training', date: '2026-01-07', start_time: '09:30', end_time: '11:30', location: 'FC Köln Training Ground' },
        { id: 'e4', title: 'ASU Prep - Online School', type: 'online_school', date: '2026-01-07', start_time: '14:00', end_time: '17:00', location: 'Housing - Study Room' },
        // Wednesday
        { id: 'e5', title: 'Team Training', type: 'training', date: '2026-01-08', start_time: '09:30', end_time: '11:30', location: 'FC Köln Training Ground' },
        { id: 'e6', title: 'Gym - Explosiveness', type: 'gym', date: '2026-01-08', start_time: '14:00', end_time: '15:30', location: 'German Sports University Gym' },
        { id: 'e7', title: 'German Class - Level A2', type: 'german_class', date: '2026-01-08', start_time: '16:00', end_time: '18:00', location: 'Cologne Language Center' },
        // Thursday
        { id: 'e8', title: 'Team Training', type: 'training', date: '2026-01-09', start_time: '09:30', end_time: '11:30', location: 'FC Köln Training Ground' },
        { id: 'e9', title: 'ASU Prep - Online School', type: 'online_school', date: '2026-01-09', start_time: '14:00', end_time: '17:00', location: 'Housing - Study Room' },
        // Friday
        { id: 'e10', title: 'Team Training', type: 'training', date: '2026-01-10', start_time: '09:30', end_time: '11:30', location: 'FC Köln Training Ground' },
        { id: 'e11', title: 'Gym - Hypertrophy', type: 'gym', date: '2026-01-10', start_time: '14:00', end_time: '15:30', location: 'German Sports University Gym' },
        { id: 'e12', title: 'German Class - Level A2', type: 'german_class', date: '2026-01-10', start_time: '16:00', end_time: '18:00', location: 'Cologne Language Center' },
        // Saturday - Match Day
        { id: 'e13', title: 'GSA League Match vs Bayern Munich Academy', type: 'match', date: '2026-01-11', start_time: '14:00', end_time: '16:00', location: 'FC Köln Training Ground 1' },
        // Sunday - Recovery
        { id: 'e14', title: 'Recovery Session', type: 'recovery', date: '2026-01-12', start_time: '10:00', end_time: '11:30', location: 'German Sports University - Wellness' },
        // Upcoming assessment
        { id: 'e15', title: 'Performance Testing', type: 'assessment', date: '2026-01-15', start_time: '09:00', end_time: '12:00', location: 'German Sports University' },
        // Social event
        { id: 'e16', title: 'Bundesliga Match Visit - FC Köln vs Leverkusen', type: 'social', date: '2026-01-18', start_time: '15:30', end_time: '18:00', location: 'RheinEnergieStadion' },
    ],
    messages: [
        { id: 'm1', from_user: 'admin-1', to_user: 'p1', subject: 'Training Schedule Update', content: 'Please note the morning training has been moved to 9 AM starting next week.', is_read: false, created_at: '2026-01-01T10:00:00Z' },
        { id: 'm2', from_user: 'staff-1', to_user: 'p2', subject: 'Performance Review', content: 'Great progress this month! Keep up the good work.', is_read: true, created_at: '2024-12-28T14:30:00Z' },
    ],
    // Phase 1: Wellness & Performance Data
    wellnessLogs: [
        { id: 'w1', player_id: 'p1', date: '2026-01-07', sleep_hours: 8, sleep_quality: 4, energy_level: 8, muscle_soreness: 2, stress_level: 3, mood: 'good', notes: 'Feeling great after rest day', created_at: '2026-01-07T07:30:00Z' },
        { id: 'w2', player_id: 'p1', date: '2026-01-06', sleep_hours: 7, sleep_quality: 3, energy_level: 6, muscle_soreness: 5, stress_level: 4, mood: 'tired', notes: 'Legs heavy from yesterday', created_at: '2026-01-06T07:30:00Z' },
        { id: 'w3', player_id: 'p2', date: '2026-01-07', sleep_hours: 9, sleep_quality: 5, energy_level: 9, muscle_soreness: 1, stress_level: 2, mood: 'excellent', notes: '', created_at: '2026-01-07T07:30:00Z' },
        { id: 'w4', player_id: 'p8', date: '2026-01-07', sleep_hours: 7.5, sleep_quality: 4, energy_level: 7, muscle_soreness: 3, stress_level: 3, mood: 'good', notes: 'Ready for training', created_at: '2026-01-07T07:15:00Z' },
        { id: 'w5', player_id: 'p15', date: '2026-01-07', sleep_hours: 8.5, sleep_quality: 5, energy_level: 8, muscle_soreness: 2, stress_level: 2, mood: 'excellent', notes: '', created_at: '2026-01-07T07:45:00Z' },
    ],
    trainingLoads: [
        { id: 'tl1', player_id: 'p1', date: '2026-01-06', session_type: 'team_training', duration: 120, rpe: 7, load_score: 840, notes: 'High intensity tactical session', created_at: '2026-01-06T11:30:00Z' },
        { id: 'tl2', player_id: 'p1', date: '2026-01-08', session_type: 'gym_explosiveness', duration: 90, rpe: 8, load_score: 720, notes: 'Focus on speed and power', created_at: '2026-01-08T15:30:00Z' },
        { id: 'tl3', player_id: 'p1', date: '2026-01-04', session_type: 'gym_hypertrophy', duration: 75, rpe: 7, load_score: 525, notes: 'Strength building', created_at: '2026-01-04T15:30:00Z' },
        { id: 'tl4', player_id: 'p2', date: '2026-01-06', session_type: 'team_training', duration: 120, rpe: 6, load_score: 720, notes: 'Technical drills', created_at: '2026-01-06T11:30:00Z' },
        { id: 'tl5', player_id: 'p1', date: '2026-01-05', session_type: 'match', duration: 90, rpe: 9, load_score: 810, notes: 'GSA League vs Bayern Munich Academy', created_at: '2026-01-05T16:00:00Z' },
    ],
    injuries: [
        { id: 'inj1', player_id: 'p10', injury_type: 'Ankle Sprain', severity: 'minor', date_occurred: '2026-01-02', expected_return: '2026-01-12', status: 'recovering', treatment_plan: 'Physio 3x/week, ice and rest', notes: 'Grade 1 sprain, progressing well' },
    ],
    // Phase 1: Pathway & Recruitment Data
    collegeTargets: [
        { id: 'ct1', player_id: 'p1', college_name: 'UCLA', division: 'D1', conference: 'Big Ten', location: 'Los Angeles, CA', interest_level: 'hot', status: 'offer_received', scholarship_amount: 75, notes: 'Head coach watched last 2 matches', contact_name: 'Coach Anderson', contact_email: 'anderson@ucla.edu', last_contact: '2024-12-20' },
        { id: 'ct2', player_id: 'p1', college_name: 'Stanford', division: 'D1', conference: 'ACC', location: 'Stanford, CA', interest_level: 'warm', status: 'in_contact', scholarship_amount: null, notes: 'Scheduled official visit Feb 2026', contact_name: 'Coach Martinez', contact_email: 'martinez@stanford.edu', last_contact: '2024-12-15' },
        { id: 'ct3', player_id: 'p1', college_name: 'Georgetown', division: 'D1', conference: 'Big East', location: 'Washington, DC', interest_level: 'cold', status: 'researching', scholarship_amount: null, notes: 'Strong academic program', contact_name: null, contact_email: null, last_contact: null },
        { id: 'ct4', player_id: 'p2', college_name: 'Wake Forest', division: 'D1', conference: 'ACC', location: 'Winston-Salem, NC', interest_level: 'hot', status: 'offer_received', scholarship_amount: 100, notes: 'Full ride offer received!', contact_name: 'Coach Williams', contact_email: 'williams@wfu.edu', last_contact: '2024-12-22' },
    ],
    scoutActivities: [
        { id: 'sa1', player_id: 'p1', scout_type: 'college', organization: 'UCLA', scout_name: 'Coach Anderson', date: '2024-12-18', event: 'GSA League Match vs Bayern Youth', notes: 'Watched full 90 minutes, spoke after match', rating: 'very_positive' },
        { id: 'sa2', player_id: 'p1', scout_type: 'agent', organization: 'Stellar Sports Group', scout_name: 'Michael Klein', date: '2024-12-10', event: 'Training Session', notes: 'Interested in representation for US market', rating: 'positive' },
        { id: 'sa3', player_id: 'p2', scout_type: 'college', organization: 'Wake Forest', scout_name: 'Coach Williams', date: '2024-12-15', event: 'GSA League Match vs PSG Academy', notes: 'Extended conversation with coaching staff', rating: 'very_positive' },
        { id: 'sa4', player_id: 'p4', scout_type: 'professional', organization: 'FC Köln U21', scout_name: 'Thomas Müller', date: '2024-12-20', event: 'Training Session', notes: 'Observing for potential U21 call-up', rating: 'neutral' },
    ],
    academicProgress: [
        { id: 'ap1', player_id: 'p1', category: 'high_school', course_name: 'ASU Prep - English 12', grade: 'A', credits: 1.0, semester: 'Fall 2024', status: 'completed' },
        { id: 'ap2', player_id: 'p1', category: 'high_school', course_name: 'ASU Prep - Calculus', grade: 'B+', credits: 1.0, semester: 'Fall 2024', status: 'completed' },
        { id: 'ap3', player_id: 'p1', category: 'high_school', course_name: 'ASU Prep - World History', grade: 'A-', credits: 1.0, semester: 'Spring 2025', status: 'in_progress' },
        { id: 'ap4', player_id: 'p1', category: 'language', course_name: 'German A2', grade: null, credits: null, semester: 'Spring 2025', status: 'in_progress', notes: 'Certification exam scheduled for March' },
        { id: 'ap5', player_id: 'p2', category: 'college', course_name: 'ASU Accelerate - Psychology 101', grade: 'A', credits: 3.0, semester: 'Fall 2024', status: 'completed', transferable: true },
    ],
    performanceTests: [
        { id: 'pt1', player_id: 'p1', test_date: '2024-12-01', test_type: 'sprint_10m', result: 1.82, unit: 'seconds', percentile: 85 },
        { id: 'pt2', player_id: 'p1', test_date: '2024-12-01', test_type: 'sprint_30m', result: 4.15, unit: 'seconds', percentile: 82 },
        { id: 'pt3', player_id: 'p1', test_date: '2024-12-01', test_type: 'vertical_jump', result: 58, unit: 'cm', percentile: 78 },
        { id: 'pt4', player_id: 'p1', test_date: '2024-09-01', test_type: 'sprint_10m', result: 1.89, unit: 'seconds', percentile: 75 },
        { id: 'pt5', player_id: 'p1', test_date: '2024-09-01', test_type: 'vertical_jump', result: 55, unit: 'cm', percentile: 72 },
    ],
    eventAttendees: [],
    // Goals, Achievements & Mental Wellness
    playerGoals: [
        { id: 'g1', player_id: 'p1', title: 'Improve Sprint Speed', description: 'Reduce 30m sprint time by 0.1 seconds', category: 'performance', goal_type: 'short_term', target_value: 4.05, current_value: 4.15, unit: 'seconds', target_date: '2026-03-01', status: 'in_progress', priority: 'high', notes: 'Focus on explosiveness training', created_at: '2024-12-15T10:00:00Z' },
        { id: 'g2', player_id: 'p1', title: 'Maintain 3.5+ GPA', description: 'Keep GPA above 3.5 for NCAA eligibility', category: 'academic', goal_type: 'long_term', target_value: 3.5, current_value: 3.7, unit: 'GPA', target_date: '2026-06-01', status: 'in_progress', priority: 'high', notes: 'All courses on track', created_at: '2024-12-10T10:00:00Z' },
        { id: 'g3', player_id: 'p1', title: 'Get First Scholarship Offer', description: 'Secure at least one D1 scholarship offer', category: 'recruitment', goal_type: 'long_term', target_value: 1, current_value: 1, unit: 'offers', target_date: '2026-02-01', status: 'completed', priority: 'high', notes: 'UCLA offer received!', completed_at: '2024-12-20T15:00:00Z', created_at: '2024-11-01T10:00:00Z' },
        { id: 'g4', player_id: 'p2', title: 'Improve Vertical Jump', description: 'Reach 65cm vertical jump', category: 'performance', goal_type: 'short_term', target_value: 65, current_value: 60, unit: 'cm', target_date: '2026-02-15', status: 'in_progress', priority: 'medium', notes: 'Added plyometrics to training', created_at: '2024-12-20T10:00:00Z' },
        { id: 'g5', player_id: 'p2', title: 'Mental Resilience', description: 'Log wellness 7 days in a row', category: 'wellness', goal_type: 'short_term', target_value: 7, current_value: 5, unit: 'days', target_date: '2026-01-10', status: 'in_progress', priority: 'medium', notes: 'Building consistency', created_at: '2024-12-28T10:00:00Z' },
    ],
    achievements: [
        { id: 'ach1', code: 'wellness_streak_7', name: '7-Day Wellness Streak', description: 'Logged wellness for 7 consecutive days', category: 'consistency', icon: '🔥', rarity: 'common', points_value: 50 },
        { id: 'ach2', code: 'wellness_streak_30', name: '30-Day Wellness Warrior', description: 'Logged wellness for 30 consecutive days', category: 'consistency', icon: '💪', rarity: 'rare', points_value: 200 },
        { id: 'ach3', code: 'first_scholarship_offer', name: 'First Offer', description: 'Received your first scholarship offer', category: 'recruitment', icon: '🎓', rarity: 'epic', points_value: 500 },
        { id: 'ach4', code: 'academic_honor_roll', name: 'Honor Roll', description: 'Achieved 3.5+ GPA', category: 'academic', icon: '📚', rarity: 'rare', points_value: 150 },
        { id: 'ach5', code: 'performance_improvement', name: 'Getting Faster', description: 'Improved sprint time by 5%+', category: 'performance', icon: '⚡', rarity: 'common', points_value: 75 },
        { id: 'ach6', code: 'perfect_week', name: 'Perfect Week', description: 'Completed all wellness logs, trainings, and tasks for a week', category: 'consistency', icon: '✨', rarity: 'epic', points_value: 300 },
        { id: 'ach7', code: 'team_player', name: 'Team Player', description: 'Completed 10 house chores', category: 'social', icon: '🤝', rarity: 'common', points_value: 50 },
        { id: 'ach8', code: 'early_riser', name: 'Early Bird', description: 'Logged wellness before 7 AM for 5 consecutive days', category: 'consistency', icon: '🌅', rarity: 'rare', points_value: 100 },
        { id: 'ach9', code: 'recovery_master', name: 'Recovery Master', description: 'Maintained 8+ hours sleep for 7 days', category: 'wellness', icon: '😴', rarity: 'common', points_value: 75 },
        { id: 'ach10', code: 'mental_resilience', name: 'Mental Fortress', description: 'Logged high confidence (8+) for 5 consecutive days', category: 'wellness', icon: '🧠', rarity: 'rare', points_value: 150 },
        { id: 'ach11', code: 'first_wellness_log', name: 'Journey Begins', description: 'Logged your first wellness check-in', category: 'consistency', icon: '🌱', rarity: 'common', points_value: 25 },
        { id: 'ach12', code: 'first_goal_completed', name: 'Goal Getter', description: 'Completed your first goal', category: 'achievement', icon: '🎯', rarity: 'common', points_value: 50 },
        { id: 'ach13', code: 'grocery_pro', name: 'Grocery Pro', description: 'Placed 5 grocery orders', category: 'consistency', icon: '🛒', rarity: 'common', points_value: 50 },
        { id: 'ach14', code: 'readiness_peak', name: 'Peak Performance', description: 'Achieved 90+ readiness score', category: 'wellness', icon: '🏆', rarity: 'rare', points_value: 150 },
        { id: 'ach15', code: 'comeback_kid', name: 'Comeback Kid', description: 'Restarted a wellness streak after breaking it', category: 'resilience', icon: '🔄', rarity: 'common', points_value: 75 },
        { id: 'ach16', code: 'wellness_streak_14', name: '14-Day Dedication', description: 'Logged wellness for 14 consecutive days', category: 'consistency', icon: '🔥', rarity: 'rare', points_value: 100 },
    ],
    playerAchievements: [
        { id: 'pa1', player_id: 'p1', achievement_id: 'ach1', unlocked_at: '2024-12-25T08:00:00Z' },
        { id: 'pa2', player_id: 'p1', achievement_id: 'ach3', unlocked_at: '2024-12-20T15:00:00Z' },
        { id: 'pa3', player_id: 'p1', achievement_id: 'ach4', unlocked_at: '2024-12-15T12:00:00Z' },
        { id: 'pa4', player_id: 'p2', achievement_id: 'ach1', unlocked_at: '2024-12-28T08:00:00Z' },
    ],
    mentalWellness: [
        { id: 'mw1', player_id: 'p1', date: '2026-01-02', confidence_level: 8, focus_quality: 7, anxiety_level: 3, motivation_level: 9, social_connection: 8, overall_mood: 'excellent', notes: 'Feeling ready for the new year', created_at: '2026-01-02T07:30:00Z' },
        { id: 'mw2', player_id: 'p1', date: '2026-01-01', confidence_level: 7, focus_quality: 6, anxiety_level: 4, motivation_level: 7, social_connection: 7, overall_mood: 'good', notes: '', created_at: '2026-01-01T07:30:00Z' },
        { id: 'mw3', player_id: 'p1', date: '2024-12-31', confidence_level: 6, focus_quality: 5, anxiety_level: 5, motivation_level: 6, social_connection: 6, overall_mood: 'okay', notes: 'Year-end reflection', created_at: '2024-12-31T07:30:00Z' },
        { id: 'mw4', player_id: 'p2', date: '2026-01-02', confidence_level: 9, focus_quality: 8, anxiety_level: 2, motivation_level: 9, social_connection: 9, overall_mood: 'excellent', notes: 'Great start to the year', created_at: '2026-01-02T07:30:00Z' },
    ],
    // Body Composition Data
    bodyComposition: [
        { id: 'bc1', player_id: 'p1', measurement_date: '2024-12-01', height_cm: 183, weight_kg: 75.5, body_fat_percent: 11.2, muscle_mass_kg: 35.8, bmi: 22.5, notes: 'Good athletic build', created_at: '2024-12-01T10:00:00Z' },
        { id: 'bc2', player_id: 'p1', measurement_date: '2024-09-01', height_cm: 182, weight_kg: 73.0, body_fat_percent: 12.5, muscle_mass_kg: 33.5, bmi: 22.0, notes: 'Start of program', created_at: '2024-09-01T10:00:00Z' },
        { id: 'bc3', player_id: 'p2', measurement_date: '2024-12-01', height_cm: 178, weight_kg: 72.0, body_fat_percent: 10.8, muscle_mass_kg: 34.2, bmi: 22.7, notes: 'Excellent composition', created_at: '2024-12-01T10:00:00Z' },
        { id: 'bc4', player_id: 'p2', measurement_date: '2024-09-01', height_cm: 177, weight_kg: 70.5, body_fat_percent: 11.5, muscle_mass_kg: 32.8, bmi: 22.5, notes: 'Start of program', created_at: '2024-09-01T10:00:00Z' },
    ],
    // Player Evaluations (Technical, Tactical, Physical, Mental)
    playerEvaluations: [
        {
            id: 'ev1',
            player_id: 'p1',
            evaluation_date: '2024-12-15',
            evaluation_type: 'quarterly',
            evaluator_id: 'staff-1',
            // Technical Scores (1-10)
            technical_first_touch: 7,
            technical_passing: 8,
            technical_dribbling: 6,
            technical_shooting: 7,
            technical_heading: 6,
            technical_crossing: 7,
            technical_notes: 'Strong passing vision, continues to develop 1v1 skills. First touch under pressure improving.',
            // Tactical Scores
            tactical_positioning: 7,
            tactical_game_reading: 8,
            tactical_decision_making: 7,
            tactical_communication: 6,
            tactical_pressing: 7,
            tactical_notes: 'Excellent understanding of space. Needs to be more vocal with teammates.',
            // Physical Scores
            physical_speed: 8,
            physical_endurance: 7,
            physical_strength: 6,
            physical_agility: 7,
            physical_balance: 7,
            physical_notes: 'Great acceleration. Building strength in gym program. Good recovery patterns.',
            // Mental Scores
            mental_focus: 8,
            mental_composure: 7,
            mental_leadership: 6,
            mental_work_rate: 8,
            mental_coachability: 9,
            mental_notes: 'Highly coachable, accepts feedback well. Growing into leadership role.',
            // Overall Assessment
            overall_rating: 7.5,
            development_stage: 'developing',
            key_strengths: 'Passing range, game intelligence, work ethic, speed',
            areas_for_improvement: 'Physical strength, 1v1 defending, vocal leadership',
            short_term_goals: 'Improve body strength by 10%, work on defensive duels',
            long_term_potential: 'High D1 prospect with potential for professional pathway',
            created_at: '2024-12-15T14:00:00Z'
        },
        {
            id: 'ev2',
            player_id: 'p2',
            evaluation_date: '2024-12-15',
            evaluation_type: 'quarterly',
            evaluator_id: 'staff-1',
            technical_first_touch: 8,
            technical_passing: 7,
            technical_dribbling: 8,
            technical_shooting: 8,
            technical_heading: 5,
            technical_crossing: 6,
            technical_notes: 'Excellent close control and finishing ability. Developing crossing technique.',
            tactical_positioning: 7,
            tactical_game_reading: 7,
            tactical_decision_making: 6,
            tactical_communication: 7,
            tactical_pressing: 8,
            tactical_notes: 'Good pressing instincts. Can improve decision-making in final third.',
            physical_speed: 9,
            physical_endurance: 7,
            physical_strength: 6,
            physical_agility: 8,
            physical_balance: 7,
            physical_notes: 'Elite speed. Continue building core strength for body challenges.',
            mental_focus: 7,
            mental_composure: 7,
            mental_leadership: 7,
            mental_work_rate: 9,
            mental_coachability: 8,
            mental_notes: 'Outstanding work rate. Maintains composure under pressure.',
            overall_rating: 7.8,
            development_stage: 'advanced',
            key_strengths: 'Pace, finishing, work rate, dribbling',
            areas_for_improvement: 'Heading, decision-making in tight spaces, body strength',
            short_term_goals: 'Improve aerial ability, refine final ball decision',
            long_term_potential: 'Top D1 program with pathway to MLS consideration',
            created_at: '2024-12-15T15:00:00Z'
        },
    ],
    // Tryout Reports
    tryoutReports: [
        { id: 'tr1', player_id: 'p1', tryout_date: '2024-11-20', organization: 'FC Köln U19', tryout_type: 'internal', duration_days: 1, result: 'positive', feedback: 'Showed composure on the ball, good decision-making. Invited to train with U19 again.', next_steps: 'Follow-up session scheduled for January', created_at: '2024-11-21T10:00:00Z' },
        { id: 'tr2', player_id: 'p2', tryout_date: '2024-10-15', organization: 'Wake Forest University', tryout_type: 'college_visit', duration_days: 3, result: 'offer', feedback: 'Impressed coaching staff with pace and finishing. Fit well with team style.', next_steps: 'Full scholarship offered, decision pending', created_at: '2024-10-18T10:00:00Z' },
    ],
    // Media Links for players
    playerMedia: [
        { id: 'pm1', player_id: 'p1', media_type: 'highlight_reel', title: 'Fall 2024 Highlights', url: 'https://veo.co/highlights/p1-fall-2024', thumbnail_url: null, created_at: '2024-12-20T10:00:00Z' },
        { id: 'pm2', player_id: 'p1', media_type: 'match_footage', title: 'vs Bayern Munich Academy', url: 'https://veo.co/match/gsa-bayern-dec2024', thumbnail_url: null, match_date: '2024-12-18', created_at: '2024-12-19T10:00:00Z' },
        { id: 'pm3', player_id: 'p2', media_type: 'highlight_reel', title: '2024 Season Best Goals', url: 'https://veo.co/highlights/p2-goals-2024', thumbnail_url: null, created_at: '2024-12-22T10:00:00Z' },
    ],
}

// Call initialization when module loads (MUST be after demoData is defined)
if (checkIsDemoMode()) {
    initializeDemoData()
}
