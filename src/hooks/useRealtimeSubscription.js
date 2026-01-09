import { useEffect, useCallback } from 'react'
import { useRealtime } from '../contexts/RealtimeContext'

/**
 * Base hook for subscribing to Supabase Realtime changes
 *
 * @param {string} channelName - Unique channel name
 * @param {string} table - Table to subscribe to
 * @param {Object} options - Configuration options
 * @param {string} options.filter - SQL filter (e.g., 'player_id=eq.123')
 * @param {string[]} options.events - Events to listen for ['INSERT', 'UPDATE', 'DELETE']
 * @param {function} options.onInsert - Callback for INSERT events
 * @param {function} options.onUpdate - Callback for UPDATE events
 * @param {function} options.onDelete - Callback for DELETE events
 * @param {function} options.onChange - Callback for all events
 * @param {boolean} options.enabled - Whether subscription is enabled (default: true)
 */
export function useRealtimeSubscription(channelName, table, options = {}) {
    const { subscribe, unsubscribe, isDemo, connectionState } = useRealtime()

    const {
        filter = null,
        events = ['INSERT', 'UPDATE', 'DELETE'],
        onInsert,
        onUpdate,
        onDelete,
        onChange,
        enabled = true
    } = options

    const handleChange = useCallback((payload) => {
        // Call specific event handler
        if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new, payload)
        } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new, payload.old, payload)
        } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old, payload)
        }

        // Call general change handler
        if (onChange) {
            onChange(payload)
        }
    }, [onInsert, onUpdate, onDelete, onChange])

    useEffect(() => {
        if (!enabled || isDemo) {
            return
        }

        const cleanup = subscribe(channelName, table, filter, handleChange, events)

        return cleanup
    }, [channelName, table, filter, enabled, isDemo, subscribe, handleChange, events.join(',')])

    return {
        isDemo,
        connectionState,
        unsubscribe: () => unsubscribe(channelName)
    }
}

export default useRealtimeSubscription
