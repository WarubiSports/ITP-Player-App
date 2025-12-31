// =============================================
// UNIFIED DATA SERVICE
// Works seamlessly in demo and production mode
// =============================================

import { isDemoMode, demoData } from './supabase'
import * as queries from './supabase-queries'
import { getLocalDate } from './date-utils'

// Helper to get data from localStorage (demo mode persistence)
const getDemoDataFromStorage = (key) => {
    const stored = localStorage.getItem(`demo_${key}`)
    return stored ? JSON.parse(stored) : demoData[key] || []
}

// Helper to save data to localStorage (demo mode persistence)
const saveDemoDataToStorage = (key, data) => {
    localStorage.setItem(`demo_${key}`, JSON.stringify(data))
}

// Helper to generate UUID for demo mode
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

// =============================================
// PLAYERS
// =============================================

export const getPlayers = async () => {
    if (isDemoMode) {
        return getDemoDataFromStorage('players')
    }
    return await queries.playerQueries.getAllPlayers()
}

export const getPlayerById = async (id) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('players').find(p => p.id === id)
    }
    return await queries.playerQueries.getPlayerById(id)
}

export const createPlayer = async (player) => {
    if (isDemoMode) {
        const players = getDemoDataFromStorage('players')
        const newPlayer = { ...player, id: generateId(), created_at: new Date().toISOString() }
        players.push(newPlayer)
        saveDemoDataToStorage('players', players)
        return newPlayer
    }
    return await queries.playerQueries.createPlayer(player)
}

export const updatePlayer = async (id, updates) => {
    if (isDemoMode) {
        const players = getDemoDataFromStorage('players')
        const index = players.findIndex(p => p.id === id)
        if (index !== -1) {
            players[index] = { ...players[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('players', players)
            return players[index]
        }
        return null
    }
    return await queries.playerQueries.updatePlayer(id, updates)
}

// =============================================
// HOUSES
// =============================================

export const getHouses = async () => {
    if (isDemoMode) {
        return getDemoDataFromStorage('houses')
    }
    return await queries.houseQueries.getAllHouses()
}

export const getHouseLeaderboard = async () => {
    if (isDemoMode) {
        const houses = getDemoDataFromStorage('houses')
        return houses.sort((a, b) => b.total_points - a.total_points)
    }
    return await queries.houseQueries.getLeaderboard()
}

// =============================================
// CHORES
// =============================================

export const getChores = async () => {
    if (isDemoMode) {
        return getDemoDataFromStorage('chores')
    }
    return await queries.choreQueries.getAllChores()
}

export const createChore = async (chore) => {
    if (isDemoMode) {
        const chores = getDemoDataFromStorage('chores')
        const newChore = { ...chore, id: generateId(), created_at: new Date().toISOString(), status: 'pending' }
        chores.push(newChore)
        saveDemoDataToStorage('chores', chores)
        return newChore
    }
    return await queries.choreQueries.createChore(chore)
}

export const updateChore = async (id, updates) => {
    if (isDemoMode) {
        const chores = getDemoDataFromStorage('chores')
        const index = chores.findIndex(c => c.id === id)
        if (index !== -1) {
            chores[index] = { ...chores[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('chores', chores)

            // Update player points if chore completed
            if (updates.status === 'completed' && chores[index].assigned_to) {
                const players = getDemoDataFromStorage('players')
                const playerIndex = players.findIndex(p => p.id === chores[index].assigned_to)
                if (playerIndex !== -1) {
                    players[playerIndex].points += chores[index].points
                    saveDemoDataToStorage('players', players)

                    // Update house points
                    const houses = getDemoDataFromStorage('houses')
                    const houseIndex = houses.findIndex(h => h.id === players[playerIndex].house_id)
                    if (houseIndex !== -1) {
                        houses[houseIndex].total_points += chores[index].points
                        saveDemoDataToStorage('houses', houses)
                    }
                }
            }

            return chores[index]
        }
        return null
    }
    return await queries.choreQueries.updateChore(id, updates)
}

export const completeChore = async (choreId) => {
    return await updateChore(choreId, {
        status: 'completed',
        completed_at: new Date().toISOString()
    })
}

export const deleteChore = async (id) => {
    if (isDemoMode) {
        const chores = getDemoDataFromStorage('chores')
        const filtered = chores.filter(c => c.id !== id)
        saveDemoDataToStorage('chores', filtered)
        return
    }
    return await queries.choreQueries.deleteChore(id)
}

// =============================================
// EVENTS
// =============================================

export const getEvents = async () => {
    if (isDemoMode) {
        return getDemoDataFromStorage('events')
    }
    return await queries.eventQueries.getAllEvents()
}

export const createEvent = async (event) => {
    if (isDemoMode) {
        const events = getDemoDataFromStorage('events')
        const newEvent = { ...event, id: generateId(), created_at: new Date().toISOString() }
        events.push(newEvent)
        saveDemoDataToStorage('events', events)
        return newEvent
    }
    return await queries.eventQueries.createEvent(event)
}

export const updateEvent = async (id, updates) => {
    if (isDemoMode) {
        const events = getDemoDataFromStorage('events')
        const index = events.findIndex(e => e.id === id)
        if (index !== -1) {
            events[index] = { ...events[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('events', events)
            return events[index]
        }
        return null
    }
    return await queries.eventQueries.updateEvent(id, updates)
}

export const deleteEvent = async (id) => {
    if (isDemoMode) {
        const events = getDemoDataFromStorage('events')
        const filtered = events.filter(e => e.id !== id)
        saveDemoDataToStorage('events', filtered)
        // Also delete event attendees
        const attendees = getDemoDataFromStorage('eventAttendees')
        const filteredAttendees = attendees.filter(a => a.event_id !== id)
        saveDemoDataToStorage('eventAttendees', filteredAttendees)
        return
    }
    return await queries.eventQueries.deleteEvent(id)
}

// Event Attendees
export const createEventAttendees = async (eventId, playerIds) => {
    if (isDemoMode) {
        const attendees = getDemoDataFromStorage('eventAttendees')
        const newAttendees = playerIds.map(playerId => ({
            id: generateId(),
            event_id: eventId,
            player_id: playerId,
            status: 'pending',
            created_at: new Date().toISOString()
        }))
        attendees.push(...newAttendees)
        saveDemoDataToStorage('eventAttendees', attendees)
        return newAttendees
    }
    return await queries.eventQueries.createEventAttendees(eventId, playerIds)
}

export const getEventAttendees = async (eventId) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('eventAttendees').filter(a => a.event_id === eventId)
    }
    return await queries.eventQueries.getEventAttendees(eventId)
}

export const getPlayerEvents = async (playerId) => {
    if (isDemoMode) {
        const events = getDemoDataFromStorage('events')
        const attendees = getDemoDataFromStorage('eventAttendees')

        // Get events where player is an attendee
        const playerEventIds = attendees
            .filter(a => a.player_id === playerId)
            .map(a => a.event_id)

        // Get events that match player's event IDs or have no attendees (everyone events)
        const allAttendees = attendees
        const eventsWithAttendees = [...new Set(allAttendees.map(a => a.event_id))]

        return events.filter(event =>
            playerEventIds.includes(event.id) || // Player is specifically invited
            !eventsWithAttendees.includes(event.id) // Event has no specific attendees (everyone)
        )
    }
    return await queries.eventQueries.getPlayerEvents(playerId)
}

// =============================================
// GOALS AND ACHIEVEMENTS
// =============================================

export const getPlayerGoals = async (playerId, status = null) => {
    if (isDemoMode) {
        const goals = getDemoDataFromStorage('playerGoals')
        let filtered = goals.filter(g => g.player_id === playerId)
        if (status) {
            filtered = filtered.filter(g => g.status === status)
        }
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return await queries.goalsQueries.getPlayerGoals(playerId, status)
}

export const createGoal = async (goal) => {
    if (isDemoMode) {
        const goals = getDemoDataFromStorage('playerGoals')
        const newGoal = {
            ...goal,
            id: generateId(),
            current_value: 0,
            status: 'in_progress',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
        goals.push(newGoal)
        saveDemoDataToStorage('playerGoals', goals)
        return newGoal
    }
    return await queries.goalsQueries.createGoal(goal)
}

export const updateGoal = async (goalId, updates) => {
    if (isDemoMode) {
        const goals = getDemoDataFromStorage('playerGoals')
        const index = goals.findIndex(g => g.id === goalId)
        if (index !== -1) {
            goals[index] = {
                ...goals[index],
                ...updates,
                updated_at: new Date().toISOString()
            }
            saveDemoDataToStorage('playerGoals', goals)
            return goals[index]
        }
        return null
    }
    return await queries.goalsQueries.updateGoal(goalId, updates)
}

export const getAchievements = async () => {
    if (isDemoMode) {
        return getDemoDataFromStorage('achievements')
    }
    return await queries.achievementsQueries.getAllAchievements()
}

export const getPlayerAchievements = async (playerId) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('playerAchievements')
            .filter(pa => pa.player_id === playerId)
    }
    return await queries.achievementsQueries.getPlayerAchievements(playerId)
}

export const unlockAchievement = async (playerId, achievementId) => {
    if (isDemoMode) {
        const playerAchievements = getDemoDataFromStorage('playerAchievements')
        // Check if already unlocked
        if (playerAchievements.some(pa => pa.player_id === playerId && pa.achievement_id === achievementId)) {
            return null
        }
        const newUnlock = {
            id: generateId(),
            player_id: playerId,
            achievement_id: achievementId,
            unlocked_at: new Date().toISOString()
        }
        playerAchievements.push(newUnlock)
        saveDemoDataToStorage('playerAchievements', playerAchievements)
        return newUnlock
    }
    return await queries.achievementsQueries.unlockAchievement(playerId, achievementId)
}

export const getMentalWellness = async (playerId, limit = 30) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('mentalWellness')
            .filter(m => m.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
    }
    return await queries.mentalWellnessQueries.getMentalWellness(playerId, limit)
}

export const createMentalWellnessLog = async (log) => {
    if (isDemoMode) {
        const logs = getDemoDataFromStorage('mentalWellness')
        const newLog = {
            ...log,
            id: generateId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
        logs.push(newLog)
        saveDemoDataToStorage('mentalWellness', logs)
        return newLog
    }
    return await queries.mentalWellnessQueries.createMentalWellnessLog(log)
}

// =============================================
// WELLNESS LOGS (PHASE 1)
// =============================================

export const getWellnessLogs = async (playerId, limit = 30) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('wellnessLogs')
            .filter(w => w.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
    }
    return await queries.wellnessQueries.getWellnessLogs(playerId, limit)
}

export const createWellnessLog = async (log) => {
    if (isDemoMode) {
        const logs = getDemoDataFromStorage('wellnessLogs')
        const newLog = { ...log, id: generateId(), created_at: new Date().toISOString() }
        logs.push(newLog)
        saveDemoDataToStorage('wellnessLogs', logs)
        return newLog
    }
    return await queries.wellnessQueries.createWellnessLog(log)
}

export const getWellnessScore = async (playerId) => {
    if (isDemoMode) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const logs = getDemoDataFromStorage('wellnessLogs')
            .filter(w => w.player_id === playerId && new Date(w.date) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.date) - new Date(a.date))

        if (logs.length === 0) return null

        const avg = logs.reduce((acc, log) => ({
            sleep_quality: acc.sleep_quality + log.sleep_quality,
            energy_level: acc.energy_level + log.energy_level,
            muscle_soreness: acc.muscle_soreness + log.muscle_soreness,
            stress_level: acc.stress_level + log.stress_level
        }), { sleep_quality: 0, energy_level: 0, muscle_soreness: 0, stress_level: 0 })

        const count = logs.length
        const score = Math.round(
            (avg.sleep_quality / count * 20) +
            (avg.energy_level / count * 10) +
            ((10 - avg.muscle_soreness / count) * 5) +
            ((10 - avg.stress_level / count) * 5)
        )

        return {
            score,
            logs,
            average: {
                sleep_quality: avg.sleep_quality / count,
                energy_level: avg.energy_level / count,
                muscle_soreness: avg.muscle_soreness / count,
                stress_level: avg.stress_level / count
            }
        }
    }
    return await queries.wellnessQueries.getWellnessScore(playerId)
}

// =============================================
// TRAINING LOADS (PHASE 1)
// =============================================

export const getTrainingLoads = async (playerId, limit = 30) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('trainingLoads')
            .filter(t => t.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
    }
    return await queries.trainingLoadQueries.getTrainingLoads(playerId, limit)
}

export const createTrainingLoad = async (load) => {
    if (isDemoMode) {
        const loads = getDemoDataFromStorage('trainingLoads')
        const newLoad = {
            ...load,
            id: generateId(),
            load_score: load.duration * load.rpe,
            created_at: new Date().toISOString()
        }
        loads.push(newLoad)
        saveDemoDataToStorage('trainingLoads', loads)
        return newLoad
    }
    return await queries.trainingLoadQueries.createTrainingLoad(load)
}

// =============================================
// INJURIES (PHASE 1)
// =============================================

export const getInjuries = async (playerId, includeCleared = false) => {
    if (isDemoMode) {
        let injuries = getDemoDataFromStorage('injuries').filter(i => i.player_id === playerId)
        if (!includeCleared) {
            injuries = injuries.filter(i => i.status !== 'cleared')
        }
        return injuries.sort((a, b) => new Date(b.date_occurred) - new Date(a.date_occurred))
    }
    return await queries.injuryQueries.getInjuries(playerId, includeCleared)
}

export const createInjury = async (injury) => {
    if (isDemoMode) {
        const injuries = getDemoDataFromStorage('injuries')
        const newInjury = { ...injury, id: generateId(), created_at: new Date().toISOString() }
        injuries.push(newInjury)
        saveDemoDataToStorage('injuries', injuries)
        return newInjury
    }
    return await queries.injuryQueries.createInjury(injury)
}

export const updateInjury = async (id, updates) => {
    if (isDemoMode) {
        const injuries = getDemoDataFromStorage('injuries')
        const index = injuries.findIndex(i => i.id === id)
        if (index !== -1) {
            injuries[index] = { ...injuries[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('injuries', injuries)
            return injuries[index]
        }
        return null
    }
    return await queries.injuryQueries.updateInjury(id, updates)
}

// =============================================
// COLLEGE TARGETS (PHASE 1)
// =============================================

export const getCollegeTargets = async (playerId) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('collegeTargets')
            .filter(ct => ct.player_id === playerId)
            .sort((a, b) => {
                const levelOrder = { hot: 0, warm: 1, cold: 2 }
                return levelOrder[a.interest_level] - levelOrder[b.interest_level]
            })
    }
    return await queries.collegeQueries.getCollegeTargets(playerId)
}

export const createCollegeTarget = async (target) => {
    if (isDemoMode) {
        const targets = getDemoDataFromStorage('collegeTargets')
        const newTarget = { ...target, id: generateId(), created_at: new Date().toISOString() }
        targets.push(newTarget)
        saveDemoDataToStorage('collegeTargets', targets)
        return newTarget
    }
    return await queries.collegeQueries.createCollegeTarget(target)
}

export const updateCollegeTarget = async (id, updates) => {
    if (isDemoMode) {
        const targets = getDemoDataFromStorage('collegeTargets')
        const index = targets.findIndex(t => t.id === id)
        if (index !== -1) {
            targets[index] = { ...targets[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('collegeTargets', targets)
            return targets[index]
        }
        return null
    }
    return await queries.collegeQueries.updateCollegeTarget(id, updates)
}

export const deleteCollegeTarget = async (id) => {
    if (isDemoMode) {
        const targets = getDemoDataFromStorage('collegeTargets')
        const filtered = targets.filter(t => t.id !== id)
        saveDemoDataToStorage('collegeTargets', filtered)
        return
    }
    return await queries.collegeQueries.deleteCollegeTarget(id)
}

// =============================================
// SCOUT ACTIVITIES (PHASE 1)
// =============================================

export const getScoutActivities = async (playerId) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('scoutActivities')
            .filter(sa => sa.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }
    return await queries.scoutQueries.getScoutActivities(playerId)
}

export const createScoutActivity = async (activity) => {
    if (isDemoMode) {
        const activities = getDemoDataFromStorage('scoutActivities')
        const newActivity = { ...activity, id: generateId(), created_at: new Date().toISOString() }
        activities.push(newActivity)
        saveDemoDataToStorage('scoutActivities', activities)
        return newActivity
    }
    return await queries.scoutQueries.createScoutActivity(activity)
}

export const updateScoutActivity = async (id, updates) => {
    if (isDemoMode) {
        const activities = getDemoDataFromStorage('scoutActivities')
        const index = activities.findIndex(a => a.id === id)
        if (index !== -1) {
            activities[index] = { ...activities[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('scoutActivities', activities)
            return activities[index]
        }
        return null
    }
    return await queries.scoutQueries.updateScoutActivity(id, updates)
}

export const deleteScoutActivity = async (id) => {
    if (isDemoMode) {
        const activities = getDemoDataFromStorage('scoutActivities')
        const filtered = activities.filter(a => a.id !== id)
        saveDemoDataToStorage('scoutActivities', filtered)
        return
    }
    return await queries.scoutQueries.deleteScoutActivity(id)
}

// =============================================
// ACADEMIC PROGRESS (PHASE 1)
// =============================================

export const getAcademicProgress = async (playerId) => {
    if (isDemoMode) {
        return getDemoDataFromStorage('academicProgress')
            .filter(ap => ap.player_id === playerId)
            .sort((a, b) => {
                const statusOrder = { in_progress: 0, completed: 1, dropped: 2, failed: 3 }
                return statusOrder[a.status] - statusOrder[b.status]
            })
    }
    return await queries.academicQueries.getAcademicProgress(playerId)
}

export const createAcademicProgress = async (progress) => {
    if (isDemoMode) {
        const progressList = getDemoDataFromStorage('academicProgress')
        const newProgress = { ...progress, id: generateId(), created_at: new Date().toISOString() }
        progressList.push(newProgress)
        saveDemoDataToStorage('academicProgress', progressList)
        return newProgress
    }
    return await queries.academicQueries.createAcademicProgress(progress)
}

export const updateAcademicProgress = async (id, updates) => {
    if (isDemoMode) {
        const progressList = getDemoDataFromStorage('academicProgress')
        const index = progressList.findIndex(p => p.id === id)
        if (index !== -1) {
            progressList[index] = { ...progressList[index], ...updates, updated_at: new Date().toISOString() }
            saveDemoDataToStorage('academicProgress', progressList)
            return progressList[index]
        }
        return null
    }
    return await queries.academicQueries.updateAcademicProgress(id, updates)
}

export const calculateGPA = async (playerId) => {
    if (isDemoMode) {
        const progressList = getDemoDataFromStorage('academicProgress')
            .filter(p => p.player_id === playerId && p.status === 'completed' && ['high_school', 'college'].includes(p.category))

        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0
        }

        let totalPoints = 0
        let totalCredits = 0

        progressList.forEach(course => {
            const points = gradePoints[course.grade]
            if (points !== undefined && course.credits) {
                totalPoints += points * course.credits
                totalCredits += course.credits
            }
        })

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null
    }
    return await queries.academicQueries.calculateGPA(playerId)
}

// =============================================
// PERFORMANCE TESTS (PHASE 1)
// =============================================

export const getPerformanceTests = async (playerId, testType = null) => {
    if (isDemoMode) {
        let tests = getDemoDataFromStorage('performanceTests').filter(pt => pt.player_id === playerId)
        if (testType) {
            tests = tests.filter(t => t.test_type === testType)
        }
        return tests.sort((a, b) => new Date(b.test_date) - new Date(a.test_date))
    }
    return await queries.performanceTestQueries.getPerformanceTests(playerId, testType)
}

export const createPerformanceTest = async (test) => {
    if (isDemoMode) {
        const tests = getDemoDataFromStorage('performanceTests')
        const newTest = { ...test, id: generateId(), created_at: new Date().toISOString() }
        tests.push(newTest)
        saveDemoDataToStorage('performanceTests', tests)
        return newTest
    }
    return await queries.performanceTestQueries.createPerformanceTest(test)
}

// =============================================
// DASHBOARD & ANALYTICS
// =============================================

export const getNextSteps = async (playerId) => {
    const today = getLocalDate() // Use CET timezone for correct date
    const nextSteps = []

    try {
        // Check wellness log for today - use data-service function
        const wellnessLogs = await getWellnessLogs(playerId, 7)
        const hasLoggedToday = wellnessLogs.some(w => w.date === today)

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

        // Check pending chores - use data-service function
        const allChores = await getChores()
        const chores = allChores
            .filter(c => c.assigned_to === playerId && c.status === 'pending')
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

        if (chores.length > 0) {
            const urgentChore = chores[0]
            nextSteps.push({
                id: `chore-${urgentChore.id}`,
                priority: urgentChore.priority,
                title: urgentChore.title,
                description: `Due ${new Date(urgentChore.deadline).toLocaleDateString()}`,
                action: '/housing',
                category: 'tasks'
            })
        }

        // Check college targets - use data-service function
        const targets = await getCollegeTargets(playerId)
        const staleTargets = targets.filter(t =>
            t.status === 'in_contact' &&
            t.interest_level === 'hot' &&
            (!t.last_contact || new Date(today) - new Date(t.last_contact) > 14 * 24 * 60 * 60 * 1000)
        )

        if (staleTargets.length > 0) {
            nextSteps.push({
                id: 'college-followup',
                priority: 'medium',
                title: 'Follow Up With Colleges',
                description: `${staleTargets.length} hot target(s) need contact`,
                action: '/pathway',
                category: 'recruitment'
            })
        }

        // Check in-progress academic courses - use data-service function
        const academic = await getAcademicProgress(playerId)
        const inProgressCourses = academic.filter(a => a.status === 'in_progress')

        if (inProgressCourses.length > 0) {
            nextSteps.push({
                id: 'academic-progress',
                priority: 'low',
                title: 'Update Academic Progress',
                description: `${inProgressCourses.length} course(s) in progress`,
                action: '/pathway',
                category: 'academics'
            })
        }

        return nextSteps.slice(0, 5)
    } catch (error) {
        console.error('Error getting next steps:', error)
        return []
    }
}

export const getDashboardStats = async () => {
    if (isDemoMode) {
        const players = getDemoDataFromStorage('players')
        const chores = getDemoDataFromStorage('chores')
        const events = getDemoDataFromStorage('events')
        const houses = getDemoDataFromStorage('houses').sort((a, b) => b.total_points - a.total_points)

        return {
            totalPlayers: players.length,
            activeToday: players.filter(p => p.status === 'active').length,
            pendingChores: chores.filter(c => c.status === 'pending').length,
            upcomingEvents: events.filter(e => new Date(e.start_time) > new Date()).length,
            topHouse: houses[0] || null
        }
    }
    return await queries.dashboardQueries.getDashboardStats()
}
