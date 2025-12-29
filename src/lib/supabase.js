import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Demo mode flag - when true, uses local storage instead of Supabase
export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL

// Demo data for when Supabase is not configured
export const demoData = {
    users: [
        { id: 'admin-1', email: 'max.bisinger@warubi-sports.com', role: 'admin', first_name: 'Max', last_name: 'Bisinger' },
        { id: 'staff-1', email: 'thomas.ellinger@warubi-sports.com', role: 'staff', first_name: 'Thomas', last_name: 'Ellinger' },
    ],
    players: [
        { id: 'p1', first_name: 'Max', last_name: 'Finkgräfe', position: 'STRIKER', house_id: 'h1', status: 'active', date_of_birth: '2005-08-15', nationality: 'Germany', points: 450 },
        { id: 'p2', first_name: 'Tim', last_name: 'Lemperle', position: 'WINGER', house_id: 'h3', status: 'active', date_of_birth: '2004-03-22', nationality: 'Germany', points: 380 },
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
        { id: 'ch1', title: 'Kitchen Deep Clean', description: 'Deep clean kitchen including appliances, counters, and floors', priority: 'high', house_id: 'h1', assigned_to: 'p1', status: 'pending', points: 25, deadline: '2025-01-03' },
        { id: 'ch2', title: 'Garden Maintenance', description: 'Trim hedges and water plants in front garden', priority: 'medium', house_id: 'h2', assigned_to: 'p3', status: 'pending', points: 15, deadline: '2025-01-04' },
        { id: 'ch3', title: 'Common Room Organization', description: 'Organize books, games, and furniture in the common room', priority: 'low', house_id: 'h3', assigned_to: 'p2', status: 'pending', points: 10, deadline: '2025-01-05' },
        { id: 'ch4', title: 'Laundry Room Clean', description: 'Clean washing machines, dryers, and organize supplies', priority: 'medium', house_id: 'h1', assigned_to: 'p4', status: 'completed', points: 20, deadline: '2025-01-02', completed_at: '2025-01-01' },
    ],
    events: [
        { id: 'e1', title: 'Morning Training', type: 'training', date: '2025-01-02', start_time: '09:00', end_time: '11:00', location: 'Training Ground A' },
        { id: 'e2', title: 'Tactical Meeting', type: 'meeting', date: '2025-01-02', start_time: '14:00', end_time: '15:30', location: 'Conference Room' },
        { id: 'e3', title: 'Fitness Assessment', type: 'assessment', date: '2025-01-03', start_time: '10:00', end_time: '12:00', location: 'Gym' },
    ],
    messages: [
        { id: 'm1', from_user: 'admin-1', to_user: 'p1', subject: 'Training Schedule Update', content: 'Please note the morning training has been moved to 9 AM starting next week.', is_read: false, created_at: '2025-01-01T10:00:00Z' },
        { id: 'm2', from_user: 'staff-1', to_user: 'p2', subject: 'Performance Review', content: 'Great progress this month! Keep up the good work.', is_read: true, created_at: '2024-12-28T14:30:00Z' },
    ],
    // Phase 1: Wellness & Performance Data
    wellnessLogs: [
        { id: 'w1', player_id: 'p1', date: '2025-01-02', sleep_hours: 8, sleep_quality: 4, energy_level: 8, muscle_soreness: 2, stress_level: 3, mood: 'good', notes: 'Feeling great after rest day', created_at: '2025-01-02T07:30:00Z' },
        { id: 'w2', player_id: 'p1', date: '2025-01-01', sleep_hours: 7, sleep_quality: 3, energy_level: 6, muscle_soreness: 5, stress_level: 4, mood: 'tired', notes: 'Legs heavy from yesterday', created_at: '2025-01-01T07:30:00Z' },
        { id: 'w3', player_id: 'p2', date: '2025-01-02', sleep_hours: 9, sleep_quality: 5, energy_level: 9, muscle_soreness: 1, stress_level: 2, mood: 'excellent', notes: '', created_at: '2025-01-02T07:30:00Z' },
    ],
    trainingLoads: [
        { id: 'tl1', player_id: 'p1', date: '2025-01-02', session_type: 'training', duration: 120, rpe: 7, load_score: 840, notes: 'High intensity tactical session', created_at: '2025-01-02T11:30:00Z' },
        { id: 'tl2', player_id: 'p1', date: '2025-01-01', session_type: 'gym', duration: 60, rpe: 8, load_score: 480, notes: 'Explosiveness focus', created_at: '2025-01-01T16:00:00Z' },
        { id: 'tl3', player_id: 'p2', date: '2025-01-02', session_type: 'training', duration: 120, rpe: 6, load_score: 720, notes: 'Technical drills', created_at: '2025-01-02T11:30:00Z' },
    ],
    injuries: [
        { id: 'inj1', player_id: 'p3', injury_type: 'Hamstring Strain', severity: 'minor', date_occurred: '2024-12-28', expected_return: '2025-01-06', status: 'recovering', treatment_plan: 'Physio 3x/week, light jogging', notes: 'Grade 1 strain, progressing well' },
    ],
    // Phase 1: Pathway & Recruitment Data
    collegeTargets: [
        { id: 'ct1', player_id: 'p1', college_name: 'UCLA', division: 'D1', conference: 'Big Ten', location: 'Los Angeles, CA', interest_level: 'hot', status: 'offer_received', scholarship_amount: 75, notes: 'Head coach watched last 2 matches', contact_name: 'Coach Anderson', contact_email: 'anderson@ucla.edu', last_contact: '2024-12-20' },
        { id: 'ct2', player_id: 'p1', college_name: 'Stanford', division: 'D1', conference: 'ACC', location: 'Stanford, CA', interest_level: 'warm', status: 'in_contact', scholarship_amount: null, notes: 'Scheduled official visit Feb 2025', contact_name: 'Coach Martinez', contact_email: 'martinez@stanford.edu', last_contact: '2024-12-15' },
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
}
