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
        { id: 'p1', first_name: 'Max', last_name: 'Finkgräfe', position: 'STRIKER', house_id: 'h1', status: 'active', age: 19, nationality: 'Germany', points: 450 },
        { id: 'p2', first_name: 'Tim', last_name: 'Lemperle', position: 'WINGER', house_id: 'h3', status: 'active', age: 20, nationality: 'Germany', points: 380 },
        { id: 'p3', first_name: 'Linton', last_name: 'Maina', position: 'WINGER', house_id: 'h2', status: 'training', age: 21, nationality: 'Germany', points: 420 },
        { id: 'p4', first_name: 'Florian', last_name: 'Kainz', position: 'MIDFIELDER', house_id: 'h1', status: 'rest', age: 22, nationality: 'Austria', points: 510 },
        { id: 'p5', first_name: 'Jan', last_name: 'Thielmann', position: 'WINGER', house_id: 'h2', status: 'active', age: 21, nationality: 'Germany', points: 395 },
        { id: 'p6', first_name: 'Dejan', last_name: 'Ljubičić', position: 'MIDFIELDER', house_id: 'h3', status: 'active', age: 25, nationality: 'Austria', points: 440 },
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
}
