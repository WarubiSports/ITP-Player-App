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

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith('chore_notified_')) {
            const datePart = key.split('_').pop()
            if (datePart && new Date(datePart) < today) {
                localStorage.removeItem(key)
            }
        }
    }
}
