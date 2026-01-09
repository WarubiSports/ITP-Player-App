import { useState, useEffect, useCallback } from 'react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { useNotification } from '../contexts/NotificationContext'
import { getChores } from '../lib/data-service'

/**
 * Hook for subscribing to real-time chore updates
 * Updates task list when chores change
 *
 * @param {Object} options
 * @param {string|null} options.playerId - Player ID for filtered chores (null for all chores)
 * @param {boolean} options.showNotifications - Show toast on chore changes (default: true)
 * @returns {Object} { chores, loading, lastUpdate, refreshChores }
 */
export function useRealtimeChores({ playerId = null, showNotifications = true } = {}) {
    const [chores, setChores] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [highlightedChore, setHighlightedChore] = useState(null)
    const { realtime } = useNotification()

    // Load chores function
    const loadChores = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getChores()
            // Filter for player if specified
            const filtered = playerId
                ? data.filter(c => c.assigned_to === playerId)
                : data
            setChores(filtered)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error loading chores:', error)
        } finally {
            setLoading(false)
        }
    }, [playerId])

    // Initial data load
    useEffect(() => {
        loadChores()
    }, [loadChores])

    // Handle chore insert
    const handleChoreInsert = useCallback((newData) => {
        // Check if this chore is relevant for the current player
        if (playerId && newData.assigned_to !== playerId) {
            return
        }

        setChores(prev => [...prev, newData])

        if (showNotifications) {
            if (newData.assigned_to === playerId) {
                realtime(`New task assigned: ${newData.title}`, 'chore')
            } else {
                realtime(`New task created: ${newData.title}`, 'chore')
            }
        }

        // Highlight the new chore
        setHighlightedChore(newData.id)
        setTimeout(() => setHighlightedChore(null), 2000)

        setLastUpdate(new Date())
    }, [playerId, showNotifications, realtime])

    // Handle chore update
    const handleChoreUpdate = useCallback((newData, oldData) => {
        // Check if chore was assigned to current player
        if (playerId) {
            const wasAssigned = oldData?.assigned_to === playerId
            const isAssigned = newData.assigned_to === playerId

            if (!wasAssigned && isAssigned) {
                // Newly assigned to this player
                setChores(prev => [...prev, newData])
                if (showNotifications) {
                    realtime(`Task assigned to you: ${newData.title}`, 'chore')
                }
            } else if (wasAssigned && !isAssigned) {
                // Unassigned from this player
                setChores(prev => prev.filter(c => c.id !== newData.id))
            } else if (isAssigned) {
                // Update existing chore
                setChores(prev => prev.map(chore =>
                    chore.id === newData.id ? { ...chore, ...newData } : chore
                ))
            }
        } else {
            // For staff, show all updates
            setChores(prev => prev.map(chore =>
                chore.id === newData.id ? { ...chore, ...newData } : chore
            ))
        }

        // Show notification for status change
        if (showNotifications && oldData && newData.status !== oldData.status) {
            if (newData.status === 'completed') {
                realtime(`Task completed: ${newData.title}`, 'chore')
            }
        }

        // Highlight the updated chore
        setHighlightedChore(newData.id)
        setTimeout(() => setHighlightedChore(null), 2000)

        setLastUpdate(new Date())
    }, [playerId, showNotifications, realtime])

    // Handle chore delete
    const handleChoreDelete = useCallback((oldData) => {
        setChores(prev => prev.filter(chore => chore.id !== oldData.id))
        setLastUpdate(new Date())
    }, [])

    // Subscribe to chores table
    useRealtimeSubscription('housing-chores', 'chores', {
        events: ['INSERT', 'UPDATE', 'DELETE'],
        onInsert: handleChoreInsert,
        onUpdate: handleChoreUpdate,
        onDelete: handleChoreDelete
    })

    return {
        chores,
        loading,
        lastUpdate,
        highlightedChore,
        refreshChores: loadChores
    }
}

export default useRealtimeChores
