// =============================================
// UNIFIED DATA SERVICE
// Works seamlessly in demo and production mode
// =============================================

import { checkIsDemoMode, demoData } from './supabase'
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('players')
    }
    return await queries.playerQueries.getAllPlayers()
}

export const getPlayerById = async (id) => {
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('players').find(p => p.id === id)
    }
    return await queries.playerQueries.getPlayerById(id)
}

export const createPlayer = async (player) => {
    if (checkIsDemoMode()) {
        const players = getDemoDataFromStorage('players')
        const newPlayer = { ...player, id: generateId(), created_at: new Date().toISOString() }
        players.push(newPlayer)
        saveDemoDataToStorage('players', players)
        return newPlayer
    }
    return await queries.playerQueries.createPlayer(player)
}

export const updatePlayer = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('houses')
    }
    return await queries.houseQueries.getAllHouses()
}

export const getHouseLeaderboard = async () => {
    if (checkIsDemoMode()) {
        const houses = getDemoDataFromStorage('houses')
        return houses.sort((a, b) => b.total_points - a.total_points)
    }
    return await queries.houseQueries.getLeaderboard()
}

// =============================================
// CHORES
// =============================================

export const getChores = async () => {
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('chores')
    }
    return await queries.choreQueries.getAllChores()
}

export const createChore = async (chore) => {
    if (checkIsDemoMode()) {
        const chores = getDemoDataFromStorage('chores')
        const newChore = { ...chore, id: generateId(), created_at: new Date().toISOString(), status: 'pending' }
        chores.push(newChore)
        saveDemoDataToStorage('chores', chores)
        return newChore
    }
    return await queries.choreQueries.createChore(chore)
}

export const updateChore = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('events')
    }
    return await queries.eventQueries.getAllEvents()
}

export const createEvent = async (event) => {
    if (checkIsDemoMode()) {
        const events = getDemoDataFromStorage('events')
        const newEvent = { ...event, id: generateId(), created_at: new Date().toISOString() }
        events.push(newEvent)
        saveDemoDataToStorage('events', events)
        return newEvent
    }
    return await queries.eventQueries.createEvent(event)
}

export const updateEvent = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('eventAttendees').filter(a => a.event_id === eventId)
    }
    return await queries.eventQueries.getEventAttendees(eventId)
}

export const getPlayerEvents = async (playerId) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('achievements')
    }
    return await queries.achievementsQueries.getAllAchievements()
}

export const getPlayerAchievements = async (playerId) => {
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('playerAchievements')
            .filter(pa => pa.player_id === playerId)
    }
    return await queries.achievementsQueries.getPlayerAchievements(playerId)
}

export const unlockAchievement = async (playerId, achievementId) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('mentalWellness')
            .filter(m => m.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
    }
    return await queries.mentalWellnessQueries.getMentalWellness(playerId, limit)
}

export const createMentalWellnessLog = async (log) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('wellnessLogs')
            .filter(w => w.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
    }
    return await queries.wellnessQueries.getWellnessLogs(playerId, limit)
}

export const createWellnessLog = async (log) => {
    if (checkIsDemoMode()) {
        const logs = getDemoDataFromStorage('wellnessLogs')
        const newLog = { ...log, id: generateId(), created_at: new Date().toISOString() }
        logs.push(newLog)
        saveDemoDataToStorage('wellnessLogs', logs)
        return newLog
    }
    return await queries.wellnessQueries.createWellnessLog(log)
}

export const getWellnessScore = async (playerId) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('trainingLoads')
            .filter(t => t.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
    }
    return await queries.trainingLoadQueries.getTrainingLoads(playerId, limit)
}

export const createTrainingLoad = async (load) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        let injuries = getDemoDataFromStorage('injuries').filter(i => i.player_id === playerId)
        if (!includeCleared) {
            injuries = injuries.filter(i => i.status !== 'cleared')
        }
        return injuries.sort((a, b) => new Date(b.date_occurred) - new Date(a.date_occurred))
    }
    return await queries.injuryQueries.getInjuries(playerId, includeCleared)
}

export const createInjury = async (injury) => {
    if (checkIsDemoMode()) {
        const injuries = getDemoDataFromStorage('injuries')
        const newInjury = { ...injury, id: generateId(), created_at: new Date().toISOString() }
        injuries.push(newInjury)
        saveDemoDataToStorage('injuries', injuries)
        return newInjury
    }
    return await queries.injuryQueries.createInjury(injury)
}

export const updateInjury = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        const targets = getDemoDataFromStorage('collegeTargets')
        const newTarget = { ...target, id: generateId(), created_at: new Date().toISOString() }
        targets.push(newTarget)
        saveDemoDataToStorage('collegeTargets', targets)
        return newTarget
    }
    return await queries.collegeQueries.createCollegeTarget(target)
}

export const updateCollegeTarget = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        return getDemoDataFromStorage('scoutActivities')
            .filter(sa => sa.player_id === playerId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }
    return await queries.scoutQueries.getScoutActivities(playerId)
}

export const createScoutActivity = async (activity) => {
    if (checkIsDemoMode()) {
        const activities = getDemoDataFromStorage('scoutActivities')
        const newActivity = { ...activity, id: generateId(), created_at: new Date().toISOString() }
        activities.push(newActivity)
        saveDemoDataToStorage('scoutActivities', activities)
        return newActivity
    }
    return await queries.scoutQueries.createScoutActivity(activity)
}

export const updateScoutActivity = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        const progressList = getDemoDataFromStorage('academicProgress')
        const newProgress = { ...progress, id: generateId(), created_at: new Date().toISOString() }
        progressList.push(newProgress)
        saveDemoDataToStorage('academicProgress', progressList)
        return newProgress
    }
    return await queries.academicQueries.createAcademicProgress(progress)
}

export const updateAcademicProgress = async (id, updates) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
        let tests = getDemoDataFromStorage('performanceTests').filter(pt => pt.player_id === playerId)
        if (testType) {
            tests = tests.filter(t => t.test_type === testType)
        }
        return tests.sort((a, b) => new Date(b.test_date) - new Date(a.test_date))
    }
    return await queries.performanceTestQueries.getPerformanceTests(playerId, testType)
}

export const createPerformanceTest = async (test) => {
    if (checkIsDemoMode()) {
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
    if (checkIsDemoMode()) {
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

// =============================================
// STREAKS & ACHIEVEMENTS (GAMIFICATION)
// =============================================

export const getWellnessStreak = async (playerId) => {
    const logs = await getWellnessLogs(playerId, 60) // Get last 60 days
    if (!logs || logs.length === 0) return { current: 0, longest: 0, lastLogDate: null }

    // Sort logs by date (newest first)
    const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date))
    const today = getLocalDate('Europe/Berlin')

    // Create a set of logged dates for fast lookup
    const loggedDates = new Set(sortedLogs.map(log => log.date))

    // Calculate current streak
    let currentStreak = 0
    let checkDate = new Date(today)

    // Check if logged today or yesterday (allow 1 day grace)
    const todayLogged = loggedDates.has(today)
    const yesterday = new Date(checkDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const yesterdayLogged = loggedDates.has(yesterdayStr)

    if (!todayLogged && !yesterdayLogged) {
        // Streak is broken
        currentStreak = 0
    } else {
        // Start counting from today or yesterday
        if (!todayLogged) {
            checkDate.setDate(checkDate.getDate() - 1)
        }

        // Count consecutive days
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (loggedDates.has(dateStr)) {
                currentStreak++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }
        }
    }

    // Calculate longest streak from all logs
    let longestStreak = currentStreak
    const allDates = Array.from(loggedDates).sort()

    if (allDates.length > 1) {
        let tempStreak = 1
        for (let i = 1; i < allDates.length; i++) {
            const prevDate = new Date(allDates[i - 1])
            const currDate = new Date(allDates[i])
            const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
                tempStreak++
                longestStreak = Math.max(longestStreak, tempStreak)
            } else {
                tempStreak = 1
            }
        }
    }

    return {
        current: currentStreak,
        longest: Math.max(longestStreak, currentStreak),
        lastLogDate: sortedLogs[0]?.date || null,
        todayLogged
    }
}

export const getPlayerAchievementsWithDetails = async (playerId) => {
    const allAchievements = await getAchievements()
    const playerAchievements = await getPlayerAchievements(playerId)

    // Map achievements with unlock status
    return allAchievements.map(achievement => {
        const playerUnlock = playerAchievements.find(pa => pa.achievement_id === achievement.id)
        return {
            ...achievement,
            unlocked: !!playerUnlock,
            unlocked_at: playerUnlock?.unlocked_at || null
        }
    })
}

export const checkAndUnlockAchievements = async (playerId) => {
    const newlyUnlocked = []
    const allAchievements = await getAchievements()
    const playerAchievements = await getPlayerAchievements(playerId)
    const unlockedIds = new Set(playerAchievements.map(pa => pa.achievement_id))

    // Get streak data
    const streak = await getWellnessStreak(playerId)

    // Check wellness streak achievements
    for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement.id)) continue

        let shouldUnlock = false

        switch (achievement.code) {
            case 'wellness_streak_7':
                shouldUnlock = streak.current >= 7 || streak.longest >= 7
                break
            case 'wellness_streak_30':
                shouldUnlock = streak.current >= 30 || streak.longest >= 30
                break
            // Add more achievement checks here as needed
            default:
                break
        }

        if (shouldUnlock) {
            const unlock = await unlockAchievement(playerId, achievement.id)
            if (unlock) {
                newlyUnlocked.push({
                    ...achievement,
                    unlocked_at: unlock.unlocked_at
                })
            }
        }
    }

    // Award points for newly unlocked achievements
    if (newlyUnlocked.length > 0) {
        const player = await getPlayerById(playerId)
        if (player) {
            const totalPoints = newlyUnlocked.reduce((sum, a) => sum + (a.points_value || 0), 0)
            await updatePlayer(playerId, { points: (player.points || 0) + totalPoints })
        }
    }

    return newlyUnlocked
}

// =============================================
// GROCERY ORDERS
// =============================================

const WEEKLY_BUDGET = 35.00

// Default grocery items for demo mode (from Google Sheets)
const defaultGroceryItems = [
    // Household Items (Free - provided by program)
    { id: 'gi-1', name: 'Baking Paper', category: 'household', price: 0.00 },
    { id: 'gi-2', name: 'Dish Soap', category: 'household', price: 0.00 },
    { id: 'gi-3', name: 'Dishwasher Pods', category: 'household', price: 0.00 },
    { id: 'gi-4', name: 'Disinfectant Spray', category: 'household', price: 0.00 },
    { id: 'gi-5', name: 'Garbage Bags', category: 'household', price: 0.00 },
    { id: 'gi-6', name: 'Hand Soap', category: 'household', price: 0.00 },
    { id: 'gi-7', name: 'Laundry Detergent', category: 'household', price: 0.00 },
    { id: 'gi-8', name: 'Paper Towels', category: 'household', price: 0.00 },
    { id: 'gi-9', name: 'Sponges', category: 'household', price: 0.00 },
    { id: 'gi-10', name: 'Swiffer Cloths', category: 'household', price: 0.00 },
    { id: 'gi-11', name: 'Toilet Paper', category: 'household', price: 0.00 },
    { id: 'gi-12', name: 'Toothpaste', category: 'household', price: 0.00 },
    { id: 'gi-13', name: 'Body Soap', category: 'household', price: 0.00 },
    { id: 'gi-14', name: 'Vacuum Bags', category: 'household', price: 0.00 },
    { id: 'gi-15', name: 'Bandaids', category: 'household', price: 0.00 },
    // Vegetables & Fruits
    { id: 'gi-16', name: 'Apples', category: 'produce', price: 1.99 },
    { id: 'gi-17', name: 'Arugula', category: 'produce', price: 1.99 },
    { id: 'gi-18', name: 'Avocados', category: 'produce', price: 1.59 },
    { id: 'gi-19', name: 'Bananas', category: 'produce', price: 0.40 },
    { id: 'gi-20', name: 'Beans', category: 'produce', price: 1.39 },
    { id: 'gi-21', name: 'Watermelon', category: 'produce', price: 3.99 },
    { id: 'gi-22', name: 'Broccoli (frozen)', category: 'produce', price: 1.89 },
    { id: 'gi-23', name: 'Carrots', category: 'produce', price: 1.29 },
    { id: 'gi-24', name: 'Cherry Tomatoes', category: 'produce', price: 1.25 },
    { id: 'gi-25', name: 'Cucumber', category: 'produce', price: 0.79 },
    { id: 'gi-26', name: 'Garlic', category: 'produce', price: 1.49 },
    { id: 'gi-27', name: 'Sour Pickles', category: 'produce', price: 0.99 },
    { id: 'gi-28', name: 'Red Grapes', category: 'produce', price: 1.99 },
    { id: 'gi-29', name: 'Lemons', category: 'produce', price: 1.69 },
    { id: 'gi-30', name: 'Lentils', category: 'produce', price: 1.65 },
    { id: 'gi-31', name: 'Lettuce', category: 'produce', price: 1.19 },
    { id: 'gi-32', name: 'Limes', category: 'produce', price: 1.65 },
    { id: 'gi-33', name: 'Mushrooms', category: 'produce', price: 1.99 },
    { id: 'gi-34', name: 'Onions', category: 'produce', price: 1.29 },
    { id: 'gi-35', name: 'Oranges', category: 'produce', price: 3.19 },
    { id: 'gi-36', name: 'Potatoes', category: 'produce', price: 2.49 },
    { id: 'gi-37', name: 'Red Pepper', category: 'produce', price: 1.59 },
    { id: 'gi-38', name: 'Tomato Paste', category: 'produce', price: 0.95 },
    { id: 'gi-39', name: 'Pomegranate', category: 'produce', price: 2.39 },
    { id: 'gi-40', name: 'Mandarines', category: 'produce', price: 2.99 },
    { id: 'gi-41', name: 'Blueberries', category: 'produce', price: 2.29 },
    { id: 'gi-42', name: 'Kiwis', category: 'produce', price: 0.59 },
    { id: 'gi-43', name: 'Spinach', category: 'produce', price: 2.00 },
    { id: 'gi-44', name: 'Berry Mix', category: 'produce', price: 3.99 },
    { id: 'gi-45', name: 'Dates', category: 'produce', price: 2.59 },
    { id: 'gi-46', name: 'Green Grapes', category: 'produce', price: 1.80 },
    { id: 'gi-47', name: 'Baby Carrots', category: 'produce', price: 0.99 },
    { id: 'gi-48', name: 'Sweet Potatoes', category: 'produce', price: 1.85 },
    { id: 'gi-49', name: 'Chickpeas', category: 'produce', price: 0.85 },
    { id: 'gi-50', name: 'Lemon Juice', category: 'produce', price: 1.69 },
    // Meat & Protein
    { id: 'gi-51', name: 'Bacon', category: 'meat', price: 1.39 },
    { id: 'gi-52', name: 'Bauchspeck', category: 'meat', price: 4.29 },
    { id: 'gi-53', name: 'Canned Tuna', category: 'meat', price: 1.29 },
    { id: 'gi-54', name: 'Chicken', category: 'meat', price: 6.79 },
    { id: 'gi-55', name: 'Eggs', category: 'meat', price: 1.99 },
    { id: 'gi-56', name: 'Ground Beef', category: 'meat', price: 4.47 },
    { id: 'gi-57', name: 'Ham', category: 'meat', price: 2.49 },
    { id: 'gi-58', name: 'Pork Steak', category: 'meat', price: 3.79 },
    { id: 'gi-59', name: 'Salami', category: 'meat', price: 2.29 },
    { id: 'gi-60', name: 'Salmon Fillet', category: 'meat', price: 5.49 },
    { id: 'gi-61', name: 'Steak', category: 'meat', price: 6.87 },
    // Dairy Products
    { id: 'gi-62', name: 'Blueberry Yogurt', category: 'dairy', price: 0.59 },
    { id: 'gi-63', name: 'Butter', category: 'dairy', price: 2.59 },
    { id: 'gi-64', name: 'Butterkäse', category: 'dairy', price: 2.99 },
    { id: 'gi-65', name: 'Cheddar', category: 'dairy', price: 2.99 },
    { id: 'gi-66', name: 'Cream Cheese', category: 'dairy', price: 1.69 },
    { id: 'gi-67', name: 'Gouda', category: 'dairy', price: 1.99 },
    { id: 'gi-68', name: 'Greek Vanilla Yogurt', category: 'dairy', price: 2.29 },
    { id: 'gi-69', name: 'Heavy Cream', category: 'dairy', price: 2.89 },
    { id: 'gi-70', name: 'Mozzarella', category: 'dairy', price: 0.85 },
    { id: 'gi-71', name: 'Parmesan Cheese', category: 'dairy', price: 1.99 },
    { id: 'gi-72', name: 'Raspberry Yogurt', category: 'dairy', price: 0.65 },
    { id: 'gi-73', name: 'Skyr', category: 'dairy', price: 1.49 },
    { id: 'gi-74', name: 'Strawberry Yogurt', category: 'dairy', price: 0.65 },
    { id: 'gi-75', name: 'Vanilla Yogurt', category: 'dairy', price: 0.65 },
    // Carbohydrates
    { id: 'gi-76', name: 'Bagels', category: 'carbs', price: 2.29 },
    { id: 'gi-77', name: 'Bread (whole grain)', category: 'carbs', price: 1.99 },
    { id: 'gi-78', name: 'Fusilli', category: 'carbs', price: 0.85 },
    { id: 'gi-79', name: 'Gnocchi', category: 'carbs', price: 1.89 },
    { id: 'gi-80', name: 'Hamburger Buns', category: 'carbs', price: 1.69 },
    { id: 'gi-81', name: 'Maccaroni', category: 'carbs', price: 1.99 },
    { id: 'gi-82', name: 'Musli', category: 'carbs', price: 2.49 },
    { id: 'gi-83', name: 'Oats', category: 'carbs', price: 0.85 },
    { id: 'gi-84', name: 'Rice', category: 'carbs', price: 2.99 },
    { id: 'gi-85', name: 'Spaghetti', category: 'carbs', price: 0.85 },
    { id: 'gi-86', name: 'Tagliatelle', category: 'carbs', price: 1.99 },
    { id: 'gi-87', name: 'Tortellini', category: 'carbs', price: 3.49 },
    { id: 'gi-88', name: 'Tortiglioni', category: 'carbs', price: 1.39 },
    { id: 'gi-89', name: 'Tortilla', category: 'carbs', price: 1.29 },
    { id: 'gi-90', name: 'Waffles', category: 'carbs', price: 1.59 },
    { id: 'gi-91', name: 'White Bread', category: 'carbs', price: 1.69 },
    { id: 'gi-92', name: 'Buldak Spicy Ramen', category: 'carbs', price: 2.29 },
    { id: 'gi-93', name: 'Croissant', category: 'carbs', price: 1.99 },
    { id: 'gi-94', name: 'Pretzels', category: 'carbs', price: 1.11 },
    { id: 'gi-95', name: 'Eierspätzle', category: 'carbs', price: 2.29 },
    { id: 'gi-96', name: 'Konjac Root Pasta', category: 'carbs', price: 3.00 },
    { id: 'gi-97', name: 'Shirataki Rice', category: 'carbs', price: 2.39 },
    { id: 'gi-98', name: 'Orecchiette', category: 'carbs', price: 2.79 },
    // Beverages
    { id: 'gi-99', name: 'Apple Juice', category: 'drinks', price: 1.29 },
    { id: 'gi-100', name: 'Chai Tea', category: 'drinks', price: 2.29 },
    { id: 'gi-101', name: 'Chocolate Milk', category: 'drinks', price: 2.29 },
    { id: 'gi-102', name: 'Instant Coffee', category: 'drinks', price: 2.69 },
    { id: 'gi-103', name: 'Mango Juice', category: 'drinks', price: 1.69 },
    { id: 'gi-104', name: 'Milk', category: 'drinks', price: 0.99 },
    { id: 'gi-105', name: 'Orange Juice', category: 'drinks', price: 2.65 },
    { id: 'gi-106', name: 'Pomegranate Juice', category: 'drinks', price: 2.69 },
    { id: 'gi-107', name: 'Sparkling Water', category: 'drinks', price: 2.34 },
    { id: 'gi-108', name: 'Coconut Water', category: 'drinks', price: 1.99 },
    // Spices & Sauces
    { id: 'gi-109', name: 'Basil', category: 'spices', price: 0.99 },
    { id: 'gi-110', name: 'Basilico Sauce', category: 'spices', price: 1.59 },
    { id: 'gi-111', name: 'BBQ Sauce', category: 'spices', price: 1.69 },
    { id: 'gi-112', name: 'Buldak Hot Sauce', category: 'spices', price: 5.89 },
    { id: 'gi-113', name: 'Brown Sugar', category: 'spices', price: 1.69 },
    { id: 'gi-114', name: 'Canned Tomatoes', category: 'spices', price: 1.19 },
    { id: 'gi-115', name: 'Chicken Seasoning', category: 'spices', price: 1.99 },
    { id: 'gi-116', name: 'Chili Flakes', category: 'spices', price: 2.39 },
    { id: 'gi-117', name: 'Cinnamon', category: 'spices', price: 2.19 },
    { id: 'gi-118', name: 'Dill', category: 'spices', price: 2.29 },
    { id: 'gi-119', name: 'Dried Thyme', category: 'spices', price: 2.19 },
    { id: 'gi-120', name: 'Flour', category: 'spices', price: 0.99 },
    { id: 'gi-121', name: 'Garlic Powder', category: 'spices', price: 2.29 },
    { id: 'gi-122', name: 'Green Pesto', category: 'spices', price: 1.09 },
    { id: 'gi-123', name: 'Honey', category: 'spices', price: 2.99 },
    { id: 'gi-124', name: 'Jam', category: 'spices', price: 3.29 },
    { id: 'gi-125', name: 'Ketchup', category: 'spices', price: 3.49 },
    { id: 'gi-126', name: 'Maple Syrup', category: 'spices', price: 4.99 },
    { id: 'gi-127', name: 'Mayo', category: 'spices', price: 3.39 },
    { id: 'gi-128', name: 'Mustard', category: 'spices', price: 1.79 },
    { id: 'gi-129', name: 'Nutella', category: 'spices', price: 4.89 },
    { id: 'gi-130', name: 'Olive Oil', category: 'spices', price: 10.99 },
    { id: 'gi-131', name: 'Onion Powder', category: 'spices', price: 2.29 },
    { id: 'gi-132', name: 'Orange Pesto', category: 'spices', price: 1.09 },
    { id: 'gi-133', name: 'Oregano', category: 'spices', price: 1.99 },
    { id: 'gi-134', name: 'Paprika', category: 'spices', price: 2.19 },
    { id: 'gi-135', name: 'Parsley', category: 'spices', price: 2.29 },
    { id: 'gi-136', name: 'Peanut Butter', category: 'spices', price: 2.99 },
    { id: 'gi-137', name: 'Pepper', category: 'spices', price: 2.09 },
    { id: 'gi-138', name: 'Cayenne Pepper', category: 'spices', price: 2.29 },
    { id: 'gi-139', name: 'Salt', category: 'spices', price: 1.29 },
    { id: 'gi-140', name: 'Sriracha', category: 'spices', price: 5.79 },
    { id: 'gi-141', name: 'Soy Sauce', category: 'spices', price: 1.79 },
    { id: 'gi-142', name: 'Teriyaki Sauce', category: 'spices', price: 3.39 },
    { id: 'gi-143', name: 'White Sugar', category: 'spices', price: 1.19 },
    { id: 'gi-144', name: 'Blueberry Jam', category: 'spices', price: 3.89 },
    { id: 'gi-145', name: 'Cajun', category: 'spices', price: 4.99 },
    { id: 'gi-146', name: 'Salad Dressing', category: 'spices', price: 2.19 },
    { id: 'gi-147', name: 'Baking Soda', category: 'spices', price: 0.85 },
    // Frozen Foods
    { id: 'gi-148', name: 'Frozen Blueberries', category: 'frozen', price: 2.99 },
    { id: 'gi-149', name: 'Frozen Mango', category: 'frozen', price: 3.29 },
    { id: 'gi-150', name: 'Frozen Raspberries', category: 'frozen', price: 4.69 },
    { id: 'gi-151', name: 'Frozen Strawberries', category: 'frozen', price: 2.69 },
    { id: 'gi-152', name: 'Ice', category: 'frozen', price: 2.49 },
    { id: 'gi-153', name: 'Frosta Penne All\'Arrabbiata', category: 'frozen', price: 4.79 },
    { id: 'gi-154', name: 'Frosta Hähnchen-Paella', category: 'frozen', price: 4.79 },
    { id: 'gi-155', name: 'Frosta Butter Chicken', category: 'frozen', price: 4.79 },
    { id: 'gi-156', name: 'Frosta Hähnchen-Geschnetzeltes', category: 'frozen', price: 4.79 },
    { id: 'gi-157', name: 'Frosta Penne Gorgonzola', category: 'frozen', price: 4.79 },
    { id: 'gi-158', name: 'Iglo Tagliatelle Pilz-Pfanne', category: 'frozen', price: 3.99 }
]

// Version for grocery items - increment when items change to force refresh
const GROCERY_VERSION = 2

export const getGroceryItems = async (category = null) => {
    if (checkIsDemoMode()) {
        const storedVersion = localStorage.getItem('groceryItemsVersion')
        let items = getDemoDataFromStorage('groceryItems')

        // Force refresh if version changed or no items
        if (!items || items.length === 0 || storedVersion !== String(GROCERY_VERSION)) {
            saveDemoDataToStorage('groceryItems', defaultGroceryItems)
            localStorage.setItem('groceryItemsVersion', String(GROCERY_VERSION))
            items = defaultGroceryItems
        }
        if (category && category !== 'all') {
            items = items.filter(item => item.category === category)
        }
        return items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    }
    return await queries.groceryQueries?.getGroceryItems(category) || []
}

export const getGroceryOrders = async (playerId = null) => {
    if (checkIsDemoMode()) {
        let orders = getDemoDataFromStorage('groceryOrders') || []
        if (playerId) {
            orders = orders.filter(o => o.player_id === playerId)
        }
        return orders.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    }
    return await queries.groceryQueries?.getGroceryOrders(playerId) || []
}

// Admin: Get all orders with player and house info for aggregation
export const getAdminGroceryOrders = async () => {
    if (checkIsDemoMode()) {
        const orders = getDemoDataFromStorage('groceryOrders') || []
        const players = getDemoDataFromStorage('players') || []
        const houses = getDemoDataFromStorage('houses') || []
        const orderItems = getDemoDataFromStorage('groceryOrderItems') || []
        const groceryItems = getDemoDataFromStorage('groceryItems') || defaultGroceryItems

        // Enrich orders with player, house, and items info
        const enrichedOrders = orders.map(order => {
            const player = players.find(p => p.id === order.player_id)
            const house = player ? houses.find(h => h.id === player.house_id) : null
            const items = orderItems
                .filter(oi => oi.order_id === order.id)
                .map(oi => {
                    const item = groceryItems.find(gi => gi.id === oi.item_id)
                    return {
                        ...oi,
                        name: item?.name || 'Unknown Item',
                        category: item?.category || 'unknown'
                    }
                })

            return {
                ...order,
                player_name: player ? `${player.first_name} ${player.last_name}` : 'Unknown',
                house_id: player?.house_id || null,
                house_name: house?.name || 'Unassigned',
                items
            }
        })

        return enrichedOrders.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    }
    // For production, you'd have a proper query with JOINs
    return await queries.groceryQueries?.getAdminGroceryOrders?.() || []
}

export const getGroceryOrderById = async (orderId) => {
    if (checkIsDemoMode()) {
        const orders = getDemoDataFromStorage('groceryOrders') || []
        const order = orders.find(o => o.id === orderId)
        if (!order) return null

        const orderItems = getDemoDataFromStorage('groceryOrderItems') || []
        const items = orderItems.filter(oi => oi.order_id === orderId)

        // Enrich items with item details
        const groceryItems = getDemoDataFromStorage('groceryItems') || defaultGroceryItems
        const enrichedItems = items.map(oi => {
            const item = groceryItems.find(gi => gi.id === oi.item_id)
            return {
                ...oi,
                name: item?.name || 'Unknown Item',
                category: item?.category || 'unknown'
            }
        })

        return { ...order, items: enrichedItems }
    }
    return await queries.groceryQueries?.getGroceryOrderById(orderId) || null
}

export const createGroceryOrder = async (order) => {
    if (checkIsDemoMode()) {
        const orders = getDemoDataFromStorage('groceryOrders') || []
        const orderItems = getDemoDataFromStorage('groceryOrderItems') || []

        // Calculate total (excluding household items)
        const groceryItems = getDemoDataFromStorage('groceryItems') || defaultGroceryItems
        let totalAmount = 0

        for (const item of order.items) {
            const groceryItem = groceryItems.find(gi => gi.id === item.itemId)
            if (groceryItem && groceryItem.category !== 'household') {
                totalAmount += groceryItem.price * item.quantity
            }
        }

        // Check budget
        if (totalAmount > WEEKLY_BUDGET) {
            throw new Error(`Order total (€${totalAmount.toFixed(2)}) exceeds weekly budget (€${WEEKLY_BUDGET})`)
        }

        const newOrder = {
            id: generateId(),
            player_id: order.playerId,
            delivery_date: order.deliveryDate,
            total_amount: totalAmount,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        orders.push(newOrder)
        saveDemoDataToStorage('groceryOrders', orders)

        // Save order items
        for (const item of order.items) {
            const groceryItem = groceryItems.find(gi => gi.id === item.itemId)
            orderItems.push({
                id: generateId(),
                order_id: newOrder.id,
                item_id: item.itemId,
                quantity: item.quantity,
                price_at_order: groceryItem?.price || 0,
                created_at: new Date().toISOString()
            })
        }
        saveDemoDataToStorage('groceryOrderItems', orderItems)

        return newOrder
    }
    return await queries.groceryQueries?.createGroceryOrder(order)
}

export const updateGroceryOrder = async (orderId, updates) => {
    if (checkIsDemoMode()) {
        const orders = getDemoDataFromStorage('groceryOrders') || []
        const index = orders.findIndex(o => o.id === orderId)
        if (index !== -1) {
            orders[index] = {
                ...orders[index],
                ...updates,
                updated_at: new Date().toISOString()
            }
            if (updates.status === 'approved') {
                orders[index].approved_at = new Date().toISOString()
            }
            if (updates.status === 'delivered') {
                orders[index].delivered_at = new Date().toISOString()
            }
            saveDemoDataToStorage('groceryOrders', orders)
            return orders[index]
        }
        return null
    }
    return await queries.groceryQueries?.updateGroceryOrder(orderId, updates)
}

export const getDeliveryDates = () => {
    const dates = []
    const today = new Date()

    // Generate next 4 Tuesday and Friday dates
    for (let i = 0; i < 30 && dates.length < 4; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const day = date.getDay()

        if (day === 2 || day === 5) { // Tuesday = 2, Friday = 5
            const dateStr = date.toISOString().split('T')[0]
            const deadlinePassed = isDeadlinePassed(dateStr)

            dates.push({
                date: dateStr,
                dayName: day === 2 ? 'Tuesday' : 'Friday',
                formattedDate: date.toLocaleDateString('en-GB'),
                deadlineText: formatDeadline(dateStr),
                expired: deadlinePassed
            })
        }
    }

    return dates
}

// Check if deadline has passed (orders must be placed by 8 AM Berlin time, 1 day before delivery)
const isDeadlinePassed = (deliveryDateStr) => {
    try {
        const [year, month, day] = deliveryDateStr.split('-').map(Number)

        // Get current time in Berlin
        const now = new Date()
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Berlin',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })

        const parts = formatter.formatToParts(now)
        const currentYear = parseInt(parts.find(p => p.type === 'year').value)
        const currentMonth = parseInt(parts.find(p => p.type === 'month').value)
        const currentDay = parseInt(parts.find(p => p.type === 'day').value)
        const currentHour = parseInt(parts.find(p => p.type === 'hour').value)

        // Calculate deadline (1 day before delivery at 8 AM)
        let deadlineDay = day - 1
        let deadlineMonth = month
        let deadlineYear = year

        if (deadlineDay < 1) {
            deadlineMonth--
            if (deadlineMonth < 1) {
                deadlineMonth = 12
                deadlineYear--
            }
            const daysInMonth = [31, (deadlineYear % 4 === 0 && deadlineYear % 100 !== 0) || deadlineYear % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            deadlineDay = daysInMonth[deadlineMonth - 1]
        }

        const currentDateNum = currentYear * 10000 + currentMonth * 100 + currentDay
        const deadlineDateNum = deadlineYear * 10000 + deadlineMonth * 100 + deadlineDay

        if (currentDateNum > deadlineDateNum) return true
        if (currentDateNum < deadlineDateNum) return false
        return currentHour >= 8
    } catch (e) {
        return true
    }
}

const formatDeadline = (deliveryDateStr) => {
    const [year, month, day] = deliveryDateStr.split('-').map(Number)

    let deadlineDay = day - 1
    let deadlineMonth = month
    let deadlineYear = year

    if (deadlineDay < 1) {
        deadlineMonth--
        if (deadlineMonth < 1) {
            deadlineMonth = 12
            deadlineYear--
        }
        const daysInMonth = [31, (deadlineYear % 4 === 0 && deadlineYear % 100 !== 0) || deadlineYear % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        deadlineDay = daysInMonth[deadlineMonth - 1]
    }

    const date = new Date(Date.UTC(deadlineYear, deadlineMonth - 1, deadlineDay))
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return `${days[date.getUTCDay()]} ${deadlineDay} ${months[deadlineMonth - 1]}, 8:00 AM`
}

export const GROCERY_BUDGET = WEEKLY_BUDGET
