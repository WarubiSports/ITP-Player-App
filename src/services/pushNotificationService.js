// Push Notification Service for browser notifications

const NOTIFICATION_PERMISSION_KEY = 'itp_notification_permission_asked'

// Check if browser supports notifications
export const isNotificationSupported = () => {
    return 'Notification' in window
}

// Get current permission status
export const getPermissionStatus = () => {
    if (!isNotificationSupported()) return 'unsupported'
    return Notification.permission
}

// Request notification permission
export const requestPermission = async () => {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported in this browser')
        return 'unsupported'
    }

    if (Notification.permission === 'granted') {
        return 'granted'
    }

    if (Notification.permission === 'denied') {
        return 'denied'
    }

    // Request permission
    const permission = await Notification.requestPermission()
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true')
    return permission
}

// Check if we've already asked for permission
export const hasAskedPermission = () => {
    return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true'
}

// Send a browser notification
export const sendNotification = (title, options = {}) => {
    if (!isNotificationSupported()) return null
    if (Notification.permission !== 'granted') return null

    const defaultOptions = {
        icon: '/fc-koln-logo.png',
        badge: '/fc-koln-logo.png',
        tag: options.tag || 'itp-notification',
        requireInteraction: false,
        silent: false,
        ...options
    }

    try {
        const notification = new Notification(title, defaultOptions)

        // Handle click - focus the app
        notification.onclick = () => {
            window.focus()
            if (options.onClick) {
                options.onClick()
            }
            notification.close()
        }

        // Auto-close after duration (default 10 seconds)
        const duration = options.duration || 10000
        if (duration > 0) {
            setTimeout(() => notification.close(), duration)
        }

        return notification
    } catch (error) {
        console.error('Error sending notification:', error)
        return null
    }
}

// Chore-specific notifications
export const sendChoreReminder = (chore, type = 'due') => {
    const titles = {
        due: `Task Due Today: ${chore.title}`,
        overdue: `Overdue Task: ${chore.title}`,
        upcoming: `Upcoming Task: ${chore.title}`
    }

    const bodies = {
        due: `Your task "${chore.title}" is due today. Don't forget to complete it!`,
        overdue: `Your task "${chore.title}" is overdue. Please complete it as soon as possible.`,
        upcoming: `Reminder: "${chore.title}" is due tomorrow.`
    }

    return sendNotification(titles[type] || titles.due, {
        body: bodies[type] || bodies.due,
        tag: `chore-${chore.id}`,
        data: { choreId: chore.id, type },
        requireInteraction: type === 'overdue'
    })
}

// Check and send reminders for pending chores
export const checkAndSendChoreReminders = (chores, playerId) => {
    if (Notification.permission !== 'granted') return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sentNotifications = []

    // Get player's pending chores
    const playerChores = chores.filter(c =>
        c.assigned_to === playerId &&
        c.status === 'pending'
    )

    for (const chore of playerChores) {
        if (!chore.deadline) continue

        const deadline = new Date(chore.deadline)
        deadline.setHours(0, 0, 0, 0)

        // Check if already notified today (use localStorage)
        const notifiedKey = `chore_notified_${chore.id}_${today.toISOString().split('T')[0]}`
        if (localStorage.getItem(notifiedKey)) continue

        if (deadline < today) {
            // Overdue
            sendChoreReminder(chore, 'overdue')
            localStorage.setItem(notifiedKey, 'true')
            sentNotifications.push({ chore, type: 'overdue' })
        } else if (deadline.getTime() === today.getTime()) {
            // Due today
            sendChoreReminder(chore, 'due')
            localStorage.setItem(notifiedKey, 'true')
            sentNotifications.push({ chore, type: 'due' })
        } else if (deadline.getTime() === tomorrow.getTime()) {
            // Due tomorrow
            sendChoreReminder(chore, 'upcoming')
            localStorage.setItem(notifiedKey, 'true')
            sentNotifications.push({ chore, type: 'upcoming' })
        }
    }

    return sentNotifications
}

// Clear old notification records (cleanup)
export const clearOldNotificationRecords = () => {
    const today = new Date()
    today.setDate(today.getDate() - 7) // Keep records for 7 days

    const prefixes = ['chore_notified_', 'event_notified_', 'goal_notified_', 'wellness_notified_', 'streak_notified_']

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && prefixes.some(prefix => key.startsWith(prefix))) {
            const datePart = key.split('_').pop()
            if (datePart && new Date(datePart) < today) {
                localStorage.removeItem(key)
            }
        }
    }
}

// ============================================
// EVENT/PRACTICE NOTIFICATIONS
// ============================================

const eventTypeLabels = {
    training: 'Training',
    match: 'Match',
    gym: 'Gym Session',
    german_class: 'German Class',
    online_school: 'Online School',
    recovery: 'Recovery Session',
    meeting: 'Meeting',
    default: 'Event'
}

const eventTypeIcons = {
    training: '⚽',
    match: '🏟️',
    gym: '💪',
    german_class: '🇩🇪',
    online_school: '📚',
    recovery: '🧘',
    meeting: '👥',
    default: '📅'
}

// Send event reminder notification
export const sendEventReminder = (event, type = 'upcoming') => {
    const eventLabel = eventTypeLabels[event.type] || eventTypeLabels.default
    const icon = eventTypeIcons[event.type] || eventTypeIcons.default

    const formatTime = (timeStr) => {
        if (!timeStr) return ''
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hour12 = hour % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
    }

    const titles = {
        upcoming: `${icon} ${eventLabel} Tomorrow`,
        today: `${icon} ${eventLabel} Today`,
        soon: `${icon} ${eventLabel} Starting Soon`
    }

    const startTime = formatTime(event.start_time)
    const bodies = {
        upcoming: `${event.title} at ${startTime} - ${event.location || 'TBD'}`,
        today: `${event.title} at ${startTime} - ${event.location || 'TBD'}`,
        soon: `${event.title} starts in 1 hour at ${event.location || 'TBD'}`
    }

    return sendNotification(titles[type] || titles.upcoming, {
        body: bodies[type] || bodies.upcoming,
        tag: `event-${event.id}-${type}`,
        data: { eventId: event.id, type }
    })
}

// Check and send reminders for upcoming events
export const checkAndSendEventReminders = (events, playerId) => {
    if (Notification.permission !== 'granted') return []

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const sentNotifications = []

    for (const event of events) {
        const eventDate = event.date
        if (!eventDate) continue

        // Check for tomorrow's events (evening reminder)
        if (eventDate === tomorrowStr) {
            const notifiedKey = `event_notified_${event.id}_upcoming_${todayStr}`
            if (!localStorage.getItem(notifiedKey)) {
                // Only send evening reminder (after 6 PM)
                if (now.getHours() >= 18) {
                    sendEventReminder(event, 'upcoming')
                    localStorage.setItem(notifiedKey, 'true')
                    sentNotifications.push({ event, type: 'upcoming' })
                }
            }
        }

        // Check for today's events (morning reminder)
        if (eventDate === todayStr) {
            const notifiedKey = `event_notified_${event.id}_today_${todayStr}`
            if (!localStorage.getItem(notifiedKey)) {
                // Morning reminder (between 7-9 AM)
                if (now.getHours() >= 7 && now.getHours() < 9) {
                    sendEventReminder(event, 'today')
                    localStorage.setItem(notifiedKey, 'true')
                    sentNotifications.push({ event, type: 'today' })
                }
            }

            // Check for "starting soon" reminder (1 hour before)
            if (event.start_time) {
                const [hours, minutes] = event.start_time.split(':').map(Number)
                const eventStart = new Date(today)
                eventStart.setHours(hours, minutes, 0, 0)

                const timeDiff = eventStart - now
                const oneHour = 60 * 60 * 1000

                // If event is 45-75 minutes away
                if (timeDiff > 45 * 60 * 1000 && timeDiff <= 75 * 60 * 1000) {
                    const soonKey = `event_notified_${event.id}_soon_${todayStr}`
                    if (!localStorage.getItem(soonKey)) {
                        sendEventReminder(event, 'soon')
                        localStorage.setItem(soonKey, 'true')
                        sentNotifications.push({ event, type: 'soon' })
                    }
                }
            }
        }
    }

    return sentNotifications
}

// ============================================
// WELLNESS LOG NOTIFICATIONS
// ============================================

// Send wellness reminder notification
export const sendWellnessReminder = () => {
    return sendNotification('📊 Daily Wellness Check-In', {
        body: 'Take a moment to log how you\'re feeling today. Your wellness data helps track your recovery and performance.',
        tag: 'wellness-reminder',
        data: { type: 'wellness' }
    })
}

// Check if wellness reminder should be sent
export const checkAndSendWellnessReminder = (hasLoggedToday) => {
    if (Notification.permission !== 'granted') return null

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const notifiedKey = `wellness_notified_${todayStr}`

    // Already logged today or already notified
    if (hasLoggedToday || localStorage.getItem(notifiedKey)) {
        return null
    }

    // Send reminder between 8-10 AM or 6-8 PM
    const hour = now.getHours()
    const isMorningWindow = hour >= 8 && hour < 10
    const isEveningWindow = hour >= 18 && hour < 20

    if (isMorningWindow || isEveningWindow) {
        sendWellnessReminder()
        localStorage.setItem(notifiedKey, 'true')
        return { type: 'wellness', time: now }
    }

    return null
}

// ============================================
// GOAL DEADLINE NOTIFICATIONS
// ============================================

// Send goal reminder notification
export const sendGoalReminder = (goal, type = 'due') => {
    const titles = {
        due: `🎯 Goal Due Today: ${goal.title}`,
        upcoming: `🎯 Goal Due Soon: ${goal.title}`,
        overdue: `⚠️ Overdue Goal: ${goal.title}`
    }

    const bodies = {
        due: `Your goal "${goal.title}" is due today. How's your progress?`,
        upcoming: `Your goal "${goal.title}" is due tomorrow. Keep pushing!`,
        overdue: `Your goal "${goal.title}" is overdue. Update your progress or adjust the deadline.`
    }

    return sendNotification(titles[type] || titles.due, {
        body: bodies[type] || bodies.due,
        tag: `goal-${goal.id}`,
        data: { goalId: goal.id, type },
        requireInteraction: type === 'overdue'
    })
}

// Check and send reminders for goals
export const checkAndSendGoalReminders = (goals, playerId) => {
    if (Notification.permission !== 'granted') return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sentNotifications = []

    // Filter player's active goals
    const playerGoals = goals.filter(g =>
        g.player_id === playerId &&
        g.status === 'active' &&
        g.target_date
    )

    for (const goal of playerGoals) {
        const targetDate = new Date(goal.target_date)
        targetDate.setHours(0, 0, 0, 0)

        const notifiedKey = `goal_notified_${goal.id}_${todayStr}`
        if (localStorage.getItem(notifiedKey)) continue

        if (targetDate < today) {
            // Overdue
            sendGoalReminder(goal, 'overdue')
            localStorage.setItem(notifiedKey, 'true')
            sentNotifications.push({ goal, type: 'overdue' })
        } else if (targetDate.getTime() === today.getTime()) {
            // Due today
            sendGoalReminder(goal, 'due')
            localStorage.setItem(notifiedKey, 'true')
            sentNotifications.push({ goal, type: 'due' })
        } else if (targetDate.getTime() === tomorrow.getTime()) {
            // Due tomorrow
            sendGoalReminder(goal, 'upcoming')
            localStorage.setItem(notifiedKey, 'true')
            sentNotifications.push({ goal, type: 'upcoming' })
        }
    }

    return sentNotifications
}

// ============================================
// STREAK NOTIFICATIONS
// ============================================

// Send streak reminder notification
export const sendStreakReminder = (streakDays) => {
    const messages = {
        low: `You have a ${streakDays}-day streak going! Log your wellness today to keep it alive.`,
        medium: `Amazing ${streakDays}-day streak! Don't break the chain - complete your daily check-in.`,
        high: `Incredible ${streakDays}-day streak! You're on fire - keep the momentum going!`
    }

    const level = streakDays >= 14 ? 'high' : streakDays >= 7 ? 'medium' : 'low'

    return sendNotification(`🔥 ${streakDays}-Day Streak at Risk!`, {
        body: messages[level],
        tag: 'streak-reminder',
        data: { type: 'streak', days: streakDays },
        requireInteraction: streakDays >= 7 // More important for longer streaks
    })
}

// Check if streak reminder should be sent
export const checkAndSendStreakReminder = (streakDays, hasLoggedToday) => {
    if (Notification.permission !== 'granted') return null
    if (hasLoggedToday || streakDays < 3) return null // Only remind if streak is worth protecting

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const notifiedKey = `streak_notified_${todayStr}`

    if (localStorage.getItem(notifiedKey)) return null

    // Send reminder in the evening (7-9 PM) if they haven't logged yet
    const hour = now.getHours()
    if (hour >= 19 && hour < 21) {
        sendStreakReminder(streakDays)
        localStorage.setItem(notifiedKey, 'true')
        return { type: 'streak', days: streakDays }
    }

    return null
}
