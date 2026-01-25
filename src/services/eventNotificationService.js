/**
 * Event Notification Service
 * Manages event reminders and notifications for upcoming events
 */

let checkInterval = null
let notificationCallback = null

// Store notified events to avoid duplicate notifications
const notifiedEvents = new Set()

// Format time from ISO string - extracts time directly (matches Staff App)
const formatTimeFromISO = (timeStr) => {
    if (!timeStr) return ''
    try {
        // Extract time part from ISO string without timezone conversion
        if (timeStr.includes('T')) {
            const timePart = timeStr.split('T')[1]?.slice(0, 5)
            if (!timePart) return ''
            // Convert to 12-hour format
            const [hours, minutes] = timePart.split(':')
            const hour = parseInt(hours, 10)
            const ampm = hour >= 12 ? 'PM' : 'AM'
            const displayHour = hour % 12 || 12
            return `${displayHour}:${minutes} ${ampm}`
        }
        return timeStr
    } catch {
        return ''
    }
}

/**
 * Check if an event should trigger a notification (2 hours before start)
 */
const shouldNotifyForEvent = (event) => {
    if (!event.start_time) return false

    const now = new Date()
    const eventStart = new Date(event.start_time)
    const timeDiff = eventStart - now

    // Notify if event is between 119 and 121 minutes away (2 hour window with 2 min tolerance)
    const twoHours = 2 * 60 * 60 * 1000
    const tolerance = 2 * 60 * 1000

    return timeDiff >= (twoHours - tolerance) && timeDiff <= (twoHours + tolerance)
}

/**
 * Check for upcoming events and trigger notifications
 */
const checkUpcomingEvents = async (playerId, getEvents) => {
    try {
        const events = await getEvents(playerId)

        events.forEach(event => {
            // Skip if already notified
            if (notifiedEvents.has(event.id)) return

            if (shouldNotifyForEvent(event)) {
                notifiedEvents.add(event.id)

                if (notificationCallback) {
                    const eventStart = new Date(event.start_time)
                    notificationCallback({
                        id: event.id,
                        title: event.title,
                        message: `${event.title} starts at ${formatTimeFromISO(event.start_time)}`,
                        type: event.type,
                        location: event.location,
                        eventTime: eventStart
                    })
                }
            }
        })
    } catch (error) {
        console.error('Error checking upcoming events:', error)
    }
}

/**
 * Start the notification service
 * @param {string} playerId - Current player ID
 * @param {Function} getEvents - Function to fetch events for the player
 * @param {Function} onNotification - Callback when a notification should be shown
 */
export const startNotificationService = (playerId, getEvents, onNotification) => {
    if (!playerId || !getEvents || !onNotification) {
        console.error('Missing required parameters for notification service')
        return
    }

    stopNotificationService()

    notificationCallback = onNotification

    // Check immediately
    checkUpcomingEvents(playerId, getEvents)

    // Check every 2 minutes
    checkInterval = setInterval(() => {
        checkUpcomingEvents(playerId, getEvents)
    }, 2 * 60 * 1000)
}

/**
 * Stop the notification service
 */
export const stopNotificationService = () => {
    if (checkInterval) {
        clearInterval(checkInterval)
        checkInterval = null
    }
    notificationCallback = null
    notifiedEvents.clear()
}

/**
 * Clear notification history (useful when events are updated)
 */
export const clearNotificationHistory = () => {
    notifiedEvents.clear()
}
