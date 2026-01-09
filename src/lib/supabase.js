import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Demo mode check - evaluated at runtime each time it's accessed
// True when: no Supabase URL configured OR user logged in via demo login
export const checkIsDemoMode = () => {
    return !import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('itp_demo_user') !== null
}

// For backwards compatibility - but prefer checkIsDemoMode() for runtime checks
export const isDemoMode = checkIsDemoMode()

// Demo data version - increment this when you change demo data structure
const DEMO_DATA_VERSION = 4

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
        { id: 'p1', email: 'max.finkgrafe@player.com', role: 'player', first_name: 'Max', last_name: 'Finkgräfe' },
        { id: 'p2', email: 'tim.lemperle@player.com', role: 'player', first_name: 'Tim', last_name: 'Lemperle' },
        // Generic demo player account
        { id: 'p1', email: 'demo.player@itp.com', role: 'player', first_name: 'Demo', last_name: 'Player' },
    ],
    players: [
        { id: 'p1', user_id: 'p1', first_name: 'Max', last_name: 'Finkgräfe', position: 'STRIKER', house_id: 'h1', status: 'active', date_of_birth: '2005-08-15', nationality: 'Germany', points: 450 },
        { id: 'p2', user_id: 'p2', first_name: 'Tim', last_name: 'Lemperle', position: 'WINGER', house_id: 'h3', status: 'active', date_of_birth: '2004-03-22', nationality: 'Germany', points: 380 },
        { id: 'p3', first_name: 'Linton', last_name: 'Maina', position: 'WINGER', house_id: 'h2', status: 'training', date_of_birth: '2003-11-12', nationality: 'Kenya', points: 420 },
        { id: 'p4', first_name: 'Florian', last_name: 'Kainz', position: 'MIDFIELDER', house_id: 'h1', status: 'rest', date_of_birth: '2002-06-24', nationality: 'Austria', points: 510 },
        { id: 'p5', first_name: 'Jan', last_name: 'Thielmann', position: 'WINGER', house_id: 'h2', status: 'active', date_of_birth: '2003-09-07', nationality: 'Germany', points: 395 },
        { id: 'p6', first_name: 'Dejan', last_name: 'Ljubičić', position: 'MIDFIELDER', house_id: 'h3', status: 'active', date_of_birth: '1999-01-30', nationality: 'Austria', points: 440 },
    ],
    houses: [
        { id: 'h1', name: 'Widdersdorf 1', total_points: 945 },
        { id: 'h2', name: 'Widdersdorf 2', total_points: 920 },
        { id: 'h3', name: 'Widdersdorf 3', total_points: 885 },
    ],
    chores: [
        { id: 'ch1', title: 'Kitchen Deep Clean', description: 'Deep clean kitchen including appliances, counters, and floors', priority: 'high', house_id: 'h1', assigned_to: 'p1', status: 'pending', points: 25, deadline: '2026-01-03' },
        { id: 'ch2', title: 'Garden Maintenance', description: 'Trim hedges and water plants in front garden', priority: 'medium', house_id: 'h2', assigned_to: 'p3', status: 'pending', points: 15, deadline: '2026-01-04' },
        { id: 'ch3', title: 'Common Room Organization', description: 'Organize books, games, and furniture in the common room', priority: 'low', house_id: 'h3', assigned_to: 'p2', status: 'pending', points: 10, deadline: '2026-01-05' },
        { id: 'ch4', title: 'Laundry Room Clean', description: 'Clean washing machines, dryers, and organize supplies', priority: 'medium', house_id: 'h1', assigned_to: 'p4', status: 'completed', points: 20, deadline: '2026-01-02', completed_at: '2026-01-01' },
    ],
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
        { id: 'w1', player_id: 'p1', date: '2026-01-02', sleep_hours: 8, sleep_quality: 4, energy_level: 8, muscle_soreness: 2, stress_level: 3, mood: 'good', notes: 'Feeling great after rest day', created_at: '2026-01-02T07:30:00Z' },
        { id: 'w2', player_id: 'p1', date: '2026-01-01', sleep_hours: 7, sleep_quality: 3, energy_level: 6, muscle_soreness: 5, stress_level: 4, mood: 'tired', notes: 'Legs heavy from yesterday', created_at: '2026-01-01T07:30:00Z' },
        { id: 'w3', player_id: 'p2', date: '2026-01-02', sleep_hours: 9, sleep_quality: 5, energy_level: 9, muscle_soreness: 1, stress_level: 2, mood: 'excellent', notes: '', created_at: '2026-01-02T07:30:00Z' },
    ],
    trainingLoads: [
        { id: 'tl1', player_id: 'p1', date: '2026-01-06', session_type: 'team_training', duration: 120, rpe: 7, load_score: 840, notes: 'High intensity tactical session', created_at: '2026-01-06T11:30:00Z' },
        { id: 'tl2', player_id: 'p1', date: '2026-01-08', session_type: 'gym_explosiveness', duration: 90, rpe: 8, load_score: 720, notes: 'Focus on speed and power', created_at: '2026-01-08T15:30:00Z' },
        { id: 'tl3', player_id: 'p1', date: '2026-01-04', session_type: 'gym_hypertrophy', duration: 75, rpe: 7, load_score: 525, notes: 'Strength building', created_at: '2026-01-04T15:30:00Z' },
        { id: 'tl4', player_id: 'p2', date: '2026-01-06', session_type: 'team_training', duration: 120, rpe: 6, load_score: 720, notes: 'Technical drills', created_at: '2026-01-06T11:30:00Z' },
        { id: 'tl5', player_id: 'p1', date: '2026-01-05', session_type: 'match', duration: 90, rpe: 9, load_score: 810, notes: 'GSA League vs Bayern Munich Academy', created_at: '2026-01-05T16:00:00Z' },
    ],
    injuries: [
        { id: 'inj1', player_id: 'p3', injury_type: 'Hamstring Strain', severity: 'minor', date_occurred: '2024-12-28', expected_return: '2026-01-06', status: 'recovering', treatment_plan: 'Physio 3x/week, light jogging', notes: 'Grade 1 strain, progressing well' },
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
}

// Call initialization when module loads (MUST be after demoData is defined)
if (checkIsDemoMode()) {
    initializeDemoData()
}
