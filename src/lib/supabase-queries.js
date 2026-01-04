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
        const { data, error} = await supabase
            .from('event_attendees')
            .update({ status })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Create event attendees in bulk
    async createEventAttendees(eventId, playerIds) {
        const attendees = playerIds.map(playerId => ({
            event_id: eventId,
            player_id: playerId,
            status: 'pending'
        }))

        const { data, error } = await supabase
            .from('event_attendees')
            .insert(attendees)
            .select()

        if (error) throw error
        return data
    },

    // Get event attendees
    async getEventAttendees(eventId) {
        const { data, error } = await supabase
            .from('event_attendees')
            .select(`
                *,
                player:players(id, first_name, last_name, position)
            `)
            .eq('event_id', eventId)

        if (error) throw error
        return data
    },

    // Get events for a specific player
    async getPlayerEvents(playerId) {
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

        // Filter to include events where player is an attendee or event has no attendees (everyone)
        return data.filter(event =>
            event.attendees.length === 0 || // No specific attendees (everyone event)
            event.attendees.some(a => a.player_id === playerId) // Player is specifically invited
        )
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
// WELLNESS & PERFORMANCE (PHASE 1)
// =============================================

export const wellnessQueries = {
    // Get wellness logs for a player
    async getWellnessLogs(playerId, limit = 30) {
        const { data, error } = await supabase
            .from('wellness_logs')
            .select('*')
            .eq('player_id', playerId)
            .order('date', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data
    },

    // Create wellness log
    async createWellnessLog(log) {
        const { data, error } = await supabase
            .from('wellness_logs')
            .insert([log])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update wellness log
    async updateWellnessLog(id, updates) {
        const { data, error } = await supabase
            .from('wellness_logs')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get 7-day wellness score
    async getWellnessScore(playerId) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data, error } = await supabase
            .from('wellness_logs')
            .select('*')
            .eq('player_id', playerId)
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: false })

        if (error) throw error

        if (!data || data.length === 0) return null

        const avg = data.reduce((acc, log) => ({
            sleep_quality: acc.sleep_quality + log.sleep_quality,
            energy_level: acc.energy_level + log.energy_level,
            muscle_soreness: acc.muscle_soreness + log.muscle_soreness,
            stress_level: acc.stress_level + log.stress_level
        }), { sleep_quality: 0, energy_level: 0, muscle_soreness: 0, stress_level: 0 })

        const count = data.length
        const score = Math.round(
            (avg.sleep_quality / count * 20) +
            (avg.energy_level / count * 10) +
            ((10 - avg.muscle_soreness / count) * 5) +
            ((10 - avg.stress_level / count) * 5)
        )

        return {
            score,
            logs: data,
            average: {
                sleep_quality: avg.sleep_quality / count,
                energy_level: avg.energy_level / count,
                muscle_soreness: avg.muscle_soreness / count,
                stress_level: avg.stress_level / count
            }
        }
    }
}

export const trainingLoadQueries = {
    // Get training loads for a player
    async getTrainingLoads(playerId, limit = 30) {
        const { data, error } = await supabase
            .from('training_loads')
            .select('*')
            .eq('player_id', playerId)
            .order('date', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data
    },

    // Create training load
    async createTrainingLoad(load) {
        const { data, error } = await supabase
            .from('training_loads')
            .insert([load])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get 7-day training load
    async getSevenDayLoad(playerId) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data, error } = await supabase
            .from('training_loads')
            .select('load_score')
            .eq('player_id', playerId)
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])

        if (error) throw error

        return data?.reduce((sum, load) => sum + load.load_score, 0) || 0
    }
}

export const injuryQueries = {
    // Get injuries for a player
    async getInjuries(playerId, includeCleared = false) {
        let query = supabase
            .from('injuries')
            .select('*')
            .eq('player_id', playerId)
            .order('date_occurred', { ascending: false })

        if (!includeCleared) {
            query = query.neq('status', 'cleared')
        }

        const { data, error } = await query

        if (error) throw error
        return data
    },

    // Create injury
    async createInjury(injury) {
        const { data, error } = await supabase
            .from('injuries')
            .insert([injury])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update injury
    async updateInjury(id, updates) {
        const { data, error } = await supabase
            .from('injuries')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}

// =============================================
// PATHWAY & RECRUITMENT (PHASE 1)
// =============================================

export const collegeQueries = {
    // Get college targets for a player
    async getCollegeTargets(playerId) {
        const { data, error } = await supabase
            .from('college_targets')
            .select('*')
            .eq('player_id', playerId)
            .order('interest_level', { ascending: true })
            .order('status', { ascending: true })

        if (error) throw error
        return data
    },

    // Create college target
    async createCollegeTarget(target) {
        const { data, error } = await supabase
            .from('college_targets')
            .insert([target])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update college target
    async updateCollegeTarget(id, updates) {
        const { data, error } = await supabase
            .from('college_targets')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete college target
    async deleteCollegeTarget(id) {
        const { error } = await supabase
            .from('college_targets')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}

export const scoutQueries = {
    // Get scout activities for a player
    async getScoutActivities(playerId) {
        const { data, error } = await supabase
            .from('scout_activities')
            .select('*')
            .eq('player_id', playerId)
            .order('date', { ascending: false })

        if (error) throw error
        return data
    },

    // Create scout activity
    async createScoutActivity(activity) {
        const { data, error } = await supabase
            .from('scout_activities')
            .insert([activity])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update scout activity
    async updateScoutActivity(id, updates) {
        const { data, error } = await supabase
            .from('scout_activities')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete scout activity
    async deleteScoutActivity(id) {
        const { error } = await supabase
            .from('scout_activities')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}

export const academicQueries = {
    // Get academic progress for a player
    async getAcademicProgress(playerId) {
        const { data, error } = await supabase
            .from('academic_progress')
            .select('*')
            .eq('player_id', playerId)
            .order('status', { ascending: true })
            .order('semester', { ascending: false })

        if (error) throw error
        return data
    },

    // Create academic progress entry
    async createAcademicProgress(progress) {
        const { data, error } = await supabase
            .from('academic_progress')
            .insert([progress])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update academic progress
    async updateAcademicProgress(id, updates) {
        const { data, error } = await supabase
            .from('academic_progress')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Calculate GPA
    async calculateGPA(playerId) {
        const { data, error } = await supabase
            .from('academic_progress')
            .select('grade, credits')
            .eq('player_id', playerId)
            .eq('status', 'completed')
            .in('category', ['high_school', 'college'])

        if (error) throw error

        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0
        }

        let totalPoints = 0
        let totalCredits = 0

        data?.forEach(course => {
            const points = gradePoints[course.grade]
            if (points !== undefined && course.credits) {
                totalPoints += points * course.credits
                totalCredits += course.credits
            }
        })

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null
    }
}

export const performanceTestQueries = {
    // Get performance tests for a player
    async getPerformanceTests(playerId, testType = null) {
        let query = supabase
            .from('performance_tests')
            .select('*')
            .eq('player_id', playerId)
            .order('test_date', { ascending: false })

        if (testType) {
            query = query.eq('test_type', testType)
        }

        const { data, error } = await query

        if (error) throw error
        return data
    },

    // Create performance test
    async createPerformanceTest(test) {
        const { data, error } = await supabase
            .from('performance_tests')
            .insert([test])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get latest tests (most recent for each test type)
    async getLatestTests(playerId) {
        const { data, error } = await supabase
            .from('performance_tests')
            .select('*')
            .eq('player_id', playerId)
            .order('test_date', { ascending: false })

        if (error) throw error

        // Get the most recent test for each type
        const latestTests = {}
        data?.forEach(test => {
            if (!latestTests[test.test_type]) {
                latestTests[test.test_type] = test
            }
        })

        return Object.values(latestTests)
    }
}

// =============================================
// GOALS, ACHIEVEMENTS & MENTAL WELLNESS
// =============================================

export const goalsQueries = {
    // Get goals for a player
    async getPlayerGoals(playerId, status = null) {
        let query = supabase
            .from('player_goals')
            .select('*')
            .eq('player_id', playerId)
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) throw error
        return data
    },

    // Create goal
    async createGoal(goal) {
        const { data, error } = await supabase
            .from('player_goals')
            .insert([goal])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update goal
    async updateGoal(goalId, updates) {
        const { data, error } = await supabase
            .from('player_goals')
            .update(updates)
            .eq('id', goalId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete goal
    async deleteGoal(goalId) {
        const { error } = await supabase
            .from('player_goals')
            .delete()
            .eq('id', goalId)

        if (error) throw error
    }
}

export const achievementsQueries = {
    // Get all achievements (catalog)
    async getAllAchievements() {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('rarity', { ascending: false })
            .order('points_value', { ascending: false })

        if (error) throw error
        return data
    },

    // Get player's unlocked achievements
    async getPlayerAchievements(playerId) {
        const { data, error } = await supabase
            .from('player_achievements')
            .select(`
                *,
                achievement:achievements(*)
            `)
            .eq('player_id', playerId)
            .order('unlocked_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Unlock achievement for player
    async unlockAchievement(playerId, achievementId) {
        const { data, error } = await supabase
            .from('player_achievements')
            .insert([{
                player_id: playerId,
                achievement_id: achievementId
            }])
            .select(`
                *,
                achievement:achievements(*)
            `)
            .single()

        if (error) throw error
        return data
    },

    // Check if player has achievement
    async hasAchievement(playerId, achievementCode) {
        const { data, error } = await supabase
            .from('player_achievements')
            .select(`
                *,
                achievement:achievements(code)
            `)
            .eq('player_id', playerId)

        if (error) throw error

        return data?.some(pa => pa.achievement?.code === achievementCode) || false
    }
}

export const mentalWellnessQueries = {
    // Get mental wellness logs for a player
    async getMentalWellness(playerId, limit = 30) {
        const { data, error } = await supabase
            .from('mental_wellness')
            .select('*')
            .eq('player_id', playerId)
            .order('date', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data
    },

    // Create mental wellness log
    async createMentalWellnessLog(log) {
        const { data, error } = await supabase
            .from('mental_wellness')
            .insert([log])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update mental wellness log
    async updateMentalWellnessLog(id, updates) {
        const { data, error } = await supabase
            .from('mental_wellness')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Get average mental wellness scores for date range
    async getMentalWellnessAverage(playerId, days = 7) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data, error } = await supabase
            .from('mental_wellness')
            .select('*')
            .eq('player_id', playerId)
            .gte('date', startDate.toISOString().split('T')[0])

        if (error) throw error

        if (!data || data.length === 0) return null

        const avg = data.reduce((acc, log) => ({
            confidence_level: acc.confidence_level + log.confidence_level,
            focus_quality: acc.focus_quality + log.focus_quality,
            anxiety_level: acc.anxiety_level + log.anxiety_level,
            motivation_level: acc.motivation_level + log.motivation_level,
            social_connection: acc.social_connection + log.social_connection
        }), {
            confidence_level: 0,
            focus_quality: 0,
            anxiety_level: 0,
            motivation_level: 0,
            social_connection: 0
        })

        const count = data.length
        return {
            confidence_level: (avg.confidence_level / count).toFixed(1),
            focus_quality: (avg.focus_quality / count).toFixed(1),
            anxiety_level: (avg.anxiety_level / count).toFixed(1),
            motivation_level: (avg.motivation_level / count).toFixed(1),
            social_connection: (avg.social_connection / count).toFixed(1),
            logs: data
        }
    }
}

// =============================================
// GROCERY ORDERS
// =============================================

export const groceryQueries = {
    // Get all grocery items
    async getGroceryItems(category = null) {
        let query = supabase
            .from('grocery_items')
            .select('*')
            .eq('in_stock', true)
            .order('category')
            .order('name')

        if (category && category !== 'all') {
            query = query.eq('category', category)
        }

        const { data, error } = await query

        if (error) throw error
        return data
    },

    // Get grocery orders for a player
    async getGroceryOrders(playerId = null) {
        let query = supabase
            .from('grocery_orders')
            .select(`
                *,
                items:grocery_order_items(
                    *,
                    item:grocery_items(id, name, category, price)
                )
            `)
            .order('submitted_at', { ascending: false })

        if (playerId) {
            query = query.eq('player_id', playerId)
        }

        const { data, error } = await query

        if (error) throw error

        // Flatten item data for easier use
        return data?.map(order => ({
            ...order,
            items: order.items?.map(oi => ({
                ...oi,
                name: oi.item?.name,
                category: oi.item?.category
            }))
        }))
    },

    // Get all orders with player and house info (for admin)
    async getAdminGroceryOrders() {
        const { data, error } = await supabase
            .from('grocery_orders')
            .select(`
                *,
                player:players(
                    id,
                    first_name,
                    last_name,
                    house_id,
                    house:houses(id, name)
                ),
                items:grocery_order_items(
                    *,
                    item:grocery_items(id, name, category, price)
                )
            `)
            .order('submitted_at', { ascending: false })

        if (error) throw error

        // Transform data for easier consumption
        return data?.map(order => ({
            ...order,
            player_name: order.player ? `${order.player.first_name} ${order.player.last_name}` : 'Unknown',
            house_id: order.player?.house_id,
            house_name: order.player?.house?.name || 'Unassigned',
            items: order.items?.map(oi => ({
                ...oi,
                name: oi.item?.name,
                category: oi.item?.category
            }))
        }))
    },

    // Get single order by ID with items
    async getGroceryOrderById(orderId) {
        const { data, error } = await supabase
            .from('grocery_orders')
            .select(`
                *,
                items:grocery_order_items(
                    *,
                    item:grocery_items(id, name, category, price)
                )
            `)
            .eq('id', orderId)
            .single()

        if (error) throw error

        return {
            ...data,
            items: data.items?.map(oi => ({
                ...oi,
                name: oi.item?.name,
                category: oi.item?.category
            }))
        }
    },

    // Create grocery order with items
    async createGroceryOrder(order) {
        const { playerId, deliveryDate, items } = order

        // First, get item prices
        const itemIds = items.map(i => i.itemId)
        const { data: groceryItems, error: itemsError } = await supabase
            .from('grocery_items')
            .select('id, price, category')
            .in('id', itemIds)

        if (itemsError) throw itemsError

        // Calculate total (excluding household items)
        let totalAmount = 0
        const itemPrices = {}
        groceryItems.forEach(gi => {
            itemPrices[gi.id] = { price: gi.price, category: gi.category }
            const orderItem = items.find(i => i.itemId === gi.id)
            if (orderItem && gi.category !== 'household') {
                totalAmount += gi.price * orderItem.quantity
            }
        })

        // Create the order
        const { data: newOrder, error: orderError } = await supabase
            .from('grocery_orders')
            .insert([{
                player_id: playerId,
                delivery_date: deliveryDate,
                total_amount: totalAmount,
                status: 'pending'
            }])
            .select()
            .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = items.map(item => ({
            order_id: newOrder.id,
            item_id: item.itemId,
            quantity: item.quantity,
            price_at_order: itemPrices[item.itemId]?.price || 0
        }))

        const { error: itemsInsertError } = await supabase
            .from('grocery_order_items')
            .insert(orderItems)

        if (itemsInsertError) throw itemsInsertError

        return newOrder
    },

    // Update grocery order status
    async updateGroceryOrder(orderId, updates) {
        const updateData = { ...updates }

        // Add timestamps for status changes
        if (updates.status === 'approved') {
            const { data: { user } } = await supabase.auth.getUser()
            updateData.approved_at = new Date().toISOString()
            updateData.approved_by = user?.id
        }
        if (updates.status === 'delivered') {
            updateData.delivered_at = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('grocery_orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete grocery order
    async deleteGroceryOrder(orderId) {
        const { error } = await supabase
            .from('grocery_orders')
            .delete()
            .eq('id', orderId)

        if (error) throw error
    },

    // Get weekly budget usage for a player
    async getWeeklyBudgetUsage(playerId, weekStart) {
        const { data, error } = await supabase
            .rpc('get_weekly_budget_usage', {
                p_player_id: playerId,
                p_week_start: weekStart
            })

        if (error) throw error
        return data
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
    },

    // Get player readiness scores
    async getPlayerReadiness() {
        const { data, error } = await supabase
            .from('player_readiness')
            .select('*')
            .order('readiness_score', { ascending: false })

        if (error) throw error
        return data
    },

    // Get personalized next steps for a player
    async getNextSteps(playerId) {
        const today = new Date().toISOString().split('T')[0]

        const [wellness, chores, collegeTargets, academic] = await Promise.all([
            wellnessQueries.getWellnessLogs(playerId, 1),
            choreQueries.getAllChores(),
            collegeQueries.getCollegeTargets(playerId),
            academicQueries.getAcademicProgress(playerId)
        ])

        const nextSteps = []

        // Check wellness log for today
        const hasLoggedToday = wellness?.[0]?.date === today
        if (!hasLoggedToday) {
            nextSteps.push({
                id: 'wellness-log',
                priority: 'high',
                title: 'Log Your Wellness',
                description: 'Complete your daily wellness check-in',
                action: '/wellness',
                category: 'wellness'
            })
        }

        // Check pending chores
        const playerChores = chores?.filter(c =>
            c.assigned_to === playerId && c.status === 'pending'
        ).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

        if (playerChores?.length > 0) {
            const urgentChore = playerChores[0]
            nextSteps.push({
                id: `chore-${urgentChore.id}`,
                priority: urgentChore.priority,
                title: urgentChore.title,
                description: `Due ${new Date(urgentChore.deadline).toLocaleDateString()}`,
                action: '/chores',
                category: 'tasks'
            })
        }

        // Check college targets with no recent contact
        const staleTargets = collegeTargets?.filter(t =>
            t.status === 'in_contact' &&
            t.interest_level === 'hot' &&
            (!t.last_contact || new Date(today) - new Date(t.last_contact) > 14 * 24 * 60 * 60 * 1000)
        )

        if (staleTargets?.length > 0) {
            nextSteps.push({
                id: 'college-followup',
                priority: 'medium',
                title: 'Follow Up With Colleges',
                description: `${staleTargets.length} hot target(s) need contact`,
                action: '/pathway',
                category: 'recruitment'
            })
        }

        // Check in-progress academic courses
        const inProgressCourses = academic?.filter(a => a.status === 'in_progress')
        if (inProgressCourses?.length > 0) {
            nextSteps.push({
                id: 'academic-progress',
                priority: 'low',
                title: 'Update Academic Progress',
                description: `${inProgressCourses.length} course(s) in progress`,
                action: '/pathway',
                category: 'academics'
            })
        }

        return nextSteps.slice(0, 5) // Return top 5 priorities
    }
}
