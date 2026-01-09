import { useState, useEffect, useCallback } from 'react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { useNotification } from '../contexts/NotificationContext'
import { getHouses } from '../lib/data-service'

/**
 * Hook for subscribing to real-time house points updates
 * Updates leaderboard when houses or players change
 *
 * @param {Object} options
 * @param {boolean} options.showNotifications - Show toast on points change (default: true)
 * @returns {Object} { houses, loading, lastUpdate }
 */
export function useRealtimeHousePoints({ showNotifications = true } = {}) {
    const [houses, setHouses] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [animatingHouse, setAnimatingHouse] = useState(null)
    const { realtime } = useNotification()

    // Initial data load
    useEffect(() => {
        const loadHouses = async () => {
            try {
                const data = await getHouses()
                const sorted = data.sort((a, b) => b.total_points - a.total_points)
                setHouses(sorted)
            } catch (error) {
                console.error('Error loading houses:', error)
            } finally {
                setLoading(false)
            }
        }
        loadHouses()
    }, [])

    // Handle house points update
    const handleHouseUpdate = useCallback((newData, oldData, payload) => {
        setHouses(prev => {
            const updated = prev.map(house =>
                house.id === newData.id ? { ...house, ...newData } : house
            )
            return updated.sort((a, b) => b.total_points - a.total_points)
        })

        // Calculate points difference for notification
        if (oldData && newData.total_points !== oldData.total_points) {
            const diff = newData.total_points - oldData.total_points
            const direction = diff > 0 ? '+' : ''

            if (showNotifications) {
                realtime(`${newData.name}: ${direction}${diff} points!`, 'points')
            }

            // Trigger animation
            setAnimatingHouse(newData.id)
            setTimeout(() => setAnimatingHouse(null), 1500)
        }

        setLastUpdate(new Date())
    }, [showNotifications, realtime])

    // Subscribe to houses table
    useRealtimeSubscription('houses-leaderboard', 'houses', {
        events: ['UPDATE'],
        onUpdate: handleHouseUpdate
    })

    // Handle player points changes (affects house totals)
    const handlePlayerUpdate = useCallback((newData, oldData, payload) => {
        // Player points changed - refresh houses
        if (oldData && newData.points !== oldData.points) {
            // Re-fetch houses to get updated totals
            getHouses().then(data => {
                const sorted = data.sort((a, b) => b.total_points - a.total_points)
                setHouses(sorted)
                setLastUpdate(new Date())
            })
        }
    }, [])

    // Subscribe to players table for points changes
    useRealtimeSubscription('players-points', 'players', {
        events: ['UPDATE'],
        onUpdate: handlePlayerUpdate
    })

    return {
        houses,
        loading,
        lastUpdate,
        animatingHouse
    }
}

export default useRealtimeHousePoints
