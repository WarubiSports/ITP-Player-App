import { useState, useEffect, useCallback } from 'react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { useNotification } from '../contexts/NotificationContext'
import { getEvents, getPlayerEvents } from '../lib/data-service'

/**
 * Hook for subscribing to real-time event updates
 * Updates calendar when events change
 *
 * @param {Object} options
 * @param {string|null} options.playerId - Player ID for filtered events (null for all events)
 * @param {boolean} options.showNotifications - Show toast on event changes (default: true)
 * @returns {Object} { events, loading, lastUpdate, refreshEvents }
 */
export function useRealtimeEvents({ playerId = null, showNotifications = true } = {}) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(null)
    const { realtime } = useNotification()

    // Load events function
    const loadEvents = useCallback(async () => {
        try {
            setLoading(true)
            let data
            if (playerId) {
                data = await getPlayerEvents(playerId)
            } else {
                data = await getEvents()
            }
            setEvents(data)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error loading events:', error)
        } finally {
            setLoading(false)
        }
    }, [playerId])

    // Initial data load
    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    // Handle event insert
    const handleEventInsert = useCallback((newData) => {
        // For player-specific views, we need to refresh to check if they're assigned
        if (playerId) {
            loadEvents()
        } else {
            setEvents(prev => [...prev, newData])
        }

        if (showNotifications) {
            realtime(`New event: ${newData.title}`, 'event')
        }
        setLastUpdate(new Date())
    }, [playerId, showNotifications, realtime, loadEvents])

    // Handle event update
    const handleEventUpdate = useCallback((newData, oldData) => {
        setEvents(prev => prev.map(event =>
            event.id === newData.id ? { ...event, ...newData } : event
        ))

        if (showNotifications && oldData) {
            realtime(`Event updated: ${newData.title}`, 'event')
        }
        setLastUpdate(new Date())
    }, [showNotifications, realtime])

    // Handle event delete
    const handleEventDelete = useCallback((oldData) => {
        setEvents(prev => prev.filter(event => event.id !== oldData.id))

        if (showNotifications) {
            realtime(`Event cancelled: ${oldData.title}`, 'event')
        }
        setLastUpdate(new Date())
    }, [showNotifications, realtime])

    // Subscribe to events table
    useRealtimeSubscription('calendar-events', 'events', {
        events: ['INSERT', 'UPDATE', 'DELETE'],
        onInsert: handleEventInsert,
        onUpdate: handleEventUpdate,
        onDelete: handleEventDelete
    })

    // Handle event_attendees changes (for player-specific events)
    const handleAttendeeChange = useCallback(() => {
        // Refresh events when attendees change
        if (playerId) {
            loadEvents()
        }
    }, [playerId, loadEvents])

    // Subscribe to event_attendees table for player-specific updates
    useRealtimeSubscription('event-attendees', 'event_attendees', {
        events: ['INSERT', 'DELETE'],
        onChange: handleAttendeeChange,
        enabled: !!playerId
    })

    return {
        events,
        loading,
        lastUpdate,
        refreshEvents: loadEvents
    }
}

export default useRealtimeEvents
