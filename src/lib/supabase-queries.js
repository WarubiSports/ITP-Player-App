// =============================================
// SUPABASE DATA ACCESS LAYER
// Centralized queries for all database operations
// =============================================

import { supabase } from './supabase'

// =============================================
// PROFILES
// =============================================

export const profileQueries = {
    // Get current user profile
    async getCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error
        return data
    },

    // Get all profiles
    async getAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Update profile
    async updateProfile(id, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}

// =============================================
// PLAYERS
// =============================================

export const playerQueries = {
    // Get all players with house info
    async getAllPlayers() {
        const { data, error } = await supabase
            .from('players')
            .select(`
                *,
                house:houses(id, name, total_points)
            `)
            .order('points', { ascending: false })

        if (error) throw error
        return data
    },

    // Get player by ID
    async getPlayerById(id) {
        const { data, error } = await supabase
            .from('players')
            .select(`
                *,
                house:houses(id, name, total_points),
                profile:profiles(email, first_name, last_name)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Get players by house
    async getPlayersByHouse(houseId) {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('house_id', houseId)
            .order('points', { ascending: false })

        if (error) throw error
        return data
    },

    // Create player
    async createPlayer(player) {
        const { data, error } = await supabase
            .from('players')
            .insert([player])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update player
    async updatePlayer(id, updates) {
        const { data, error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete player
    async deletePlayer(id) {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Get player stats
    async getPlayerStats() {
        const { data, error } = await supabase
            .from('player_stats')
            .select('*')
            .order('points', { ascending: false })

        if (error) throw error
        return data
    }
}

// =============================================
// HOUSES
// =============================================

export const houseQueries = {
    // Get all houses
    async getAllHouses() {
        const { data, error } = await supabase
            .from('houses')
            .select('*')
            .order('total_points', { ascending: false })

        if (error) throw error
        return data
    },

    // Get house leaderboard
    async getLeaderboard() {
        const { data, error } = await supabase
            .from('house_leaderboard')
            .select('*')

        if (error) throw error
        return data
    },

    // Get house by ID with players
    async getHouseById(id) {
        const { data, error } = await supabase
            .from('houses')
            .select(`
                *,
                players:players(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Create house
    async createHouse(house) {
        const { data, error } = await supabase
            .from('houses')
            .insert([house])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update house
    async updateHouse(id, updates) {
        const { data, error} = await supabase
            .from('houses')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}

// =============================================
// CHORES
// =============================================

export const choreQueries = {
    // Get all chores
    async getAllChores() {
        const { data, error } = await supabase
            .from('chores')
            .select(`
                *,
                house:houses(id, name),
                assigned_player:players(id, first_name, last_name),
                created_by_user:profiles(id, first_name, last_name)
            `)
            .order('deadline', { ascending: true, nullsFirst: false })

        if (error) throw error
        return data
    },

    // Get chores by status
    async getChoresByStatus(status) {
        const { data, error } = await supabase
            .from('chores')
            .select(`
                *,
                house:houses(id, name),
                assigned_player:players(id, first_name, last_name)
            `)
            .eq('status', status)
            .order('deadline', { ascending: true })

        if (error) throw error
        return data
    },

    // Get chores by house
    async getChoresByHouse(houseId) {
        const { data, error } = await supabase
            .from('chores')
            .select('*')
            .eq('house_id', houseId)
            .order('deadline', { ascending: true })

        if (error) throw error
        return data
    },

    // Create chore
    async createChore(chore) {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('chores')
            .insert([{ ...chore, created_by: user.id }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update chore
    async updateChore(id, updates) {
        const { data, error } = await supabase
            .from('chores')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Mark chore as complete
    async completeChore(id) {
        const { data, error } = await supabase
            .from('chores')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete chore
    async deleteChore(id) {
        const { error } = await supabase
            .from('chores')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}

// =============================================
// EVENTS
// =============================================

export const eventQueries = {
    // Get all events
    async getAllEvents() {
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                created_by_user:profiles(id, first_name, last_name),
                attendees:event_attendees(
                    *,
                    player:players(id, first_name, last_name)
                )
            `)
            .order('start_time', { ascending: true })

        if (error) throw error
        return data
    },

    // Get events by date range
    async getEventsByDateRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .order('start_time', { ascending: true })

        if (error) throw error
        return data
    },

    // Create event
    async createEvent(event) {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('events')
            .insert([{ ...event, created_by: user.id }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update event
    async updateEvent(id, updates) {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete event
    async deleteEvent(id) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Add event attendee
    async addAttendee(eventId, playerId, status = 'pending') {
        const { data, error } = await supabase
            .from('event_attendees')
            .insert([{
                event_id: eventId,
                player_id: playerId,
                status
            }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update attendee status
    async updateAttendeeStatus(id, status) {
        const { data, error } = await supabase
            .from('event_attendees')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}

// =============================================
// MESSAGES
// =============================================

export const messageQueries = {
    // Get inbox messages
    async getInboxMessages() {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:from_user(id, first_name, last_name, email),
                recipient:to_user(id, first_name, last_name, email)
            `)
            .eq('to_user', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Get sent messages
    async getSentMessages() {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:from_user(id, first_name, last_name, email),
                recipient:to_user(id, first_name, last_name, email)
            `)
            .eq('from_user', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Send message
    async sendMessage(message) {
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('messages')
            .insert([{ ...message, from_user: user.id }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Mark message as read
    async markAsRead(id) {
        const { data, error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get unread count
    async getUnreadCount() {
        const { data: { user } } = await supabase.auth.getUser()

        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('to_user', user.id)
            .eq('is_read', false)

        if (error) throw error
        return count
    }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

export const subscriptions = {
    // Subscribe to players changes
    subscribeToPlayers(callback) {
        return supabase
            .channel('players-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'players'
                },
                callback
            )
            .subscribe()
    },

    // Subscribe to chores changes
    subscribeToChores(callback) {
        return supabase
            .channel('chores-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chores'
                },
                callback
            )
            .subscribe()
    },

    // Subscribe to messages
    subscribeToMessages(userId, callback) {
        return supabase
            .channel('messages-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `to_user=eq.${userId}`
                },
                callback
            )
            .subscribe()
    },

    // Subscribe to house leaderboard
    subscribeToHouses(callback) {
        return supabase
            .channel('houses-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'houses'
                },
                callback
            )
            .subscribe()
    },

    // Unsubscribe from channel
    unsubscribe(channel) {
        return supabase.removeChannel(channel)
    }
}

// =============================================
// ANALYTICS / DASHBOARD
// =============================================

export const dashboardQueries = {
    // Get dashboard stats
    async getDashboardStats() {
        const [players, chores, events, houses] = await Promise.all([
            playerQueries.getAllPlayers(),
            choreQueries.getAllChores(),
            eventQueries.getAllEvents(),
            houseQueries.getLeaderboard()
        ])

        const stats = {
            totalPlayers: players?.length || 0,
            activeToday: players?.filter(p => p.status === 'active').length || 0,
            pendingChores: chores?.filter(c => c.status === 'pending').length || 0,
            upcomingEvents: events?.filter(e => new Date(e.start_time) > new Date()).length || 0,
            topHouse: houses?.[0] || null
        }

        return stats
    },

    // Get recent activity
    async getRecentActivity(limit = 10) {
        const { data, error } = await supabase
            .from('activity_log')
            .select(`
                *,
                user:profiles(id, first_name, last_name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data
    }
}
