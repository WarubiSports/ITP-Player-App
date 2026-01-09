import { useState, useEffect, useCallback } from 'react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { useNotification } from '../contexts/NotificationContext'
import { getWellnessLogs, getPlayers } from '../lib/data-service'

/**
 * Hook for subscribing to real-time wellness log updates
 * For staff to monitor player wellness in real-time
 *
 * @param {Object} options
 * @param {boolean} options.showNotifications - Show toast on wellness logs (default: true)
 * @param {number} options.limit - Number of recent logs to show (default: 20)
 * @returns {Object} { logs, players, loading, lastUpdate }
 */
export function useRealtimeWellness({ showNotifications = true, limit = 20 } = {}) {
    const [logs, setLogs] = useState([])
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(null)
    const [newLogId, setNewLogId] = useState(null)
    const { realtime } = useNotification()

    // Load all wellness logs (for staff view)
    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [playersData] = await Promise.all([
                getPlayers()
            ])
            setPlayers(playersData || [])

            // Load logs for all players
            const allLogs = []
            for (const player of playersData || []) {
                const playerLogs = await getWellnessLogs(player.id)
                allLogs.push(...playerLogs.map(log => ({ ...log, player })))
            }

            // Sort by date descending and limit
            const sorted = allLogs
                .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
                .slice(0, limit)

            setLogs(sorted)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error loading wellness data:', error)
        } finally {
            setLoading(false)
        }
    }, [limit])

    // Initial data load
    useEffect(() => {
        loadData()
    }, [loadData])

    // Get player name by ID
    const getPlayerName = useCallback((playerId) => {
        const player = players.find(p => p.id === playerId)
        return player ? `${player.first_name} ${player.last_name}` : 'Unknown Player'
    }, [players])

    // Handle new wellness log
    const handleLogInsert = useCallback((newData) => {
        const playerName = getPlayerName(newData.player_id)
        const player = players.find(p => p.id === newData.player_id)

        setLogs(prev => {
            const newLog = { ...newData, player }
            const updated = [newLog, ...prev].slice(0, limit)
            return updated
        })

        if (showNotifications) {
            const moodEmoji = {
                excellent: '😄',
                good: '🙂',
                neutral: '😐',
                poor: '😕',
                terrible: '😢'
            }
            const emoji = moodEmoji[newData.mood] || '📊'
            realtime(`${playerName} logged wellness ${emoji}`, 'wellness')
        }

        // Highlight new log
        setNewLogId(newData.id)
        setTimeout(() => setNewLogId(null), 3000)

        setLastUpdate(new Date())
    }, [players, getPlayerName, showNotifications, realtime, limit])

    // Handle log update
    const handleLogUpdate = useCallback((newData) => {
        const player = players.find(p => p.id === newData.player_id)
        setLogs(prev => prev.map(log =>
            log.id === newData.id ? { ...newData, player } : log
        ))
        setLastUpdate(new Date())
    }, [players])

    // Subscribe to wellness_logs table
    useRealtimeSubscription('staff-wellness-monitor', 'wellness_logs', {
        events: ['INSERT', 'UPDATE'],
        onInsert: handleLogInsert,
        onUpdate: handleLogUpdate
    })

    // Get wellness alert level based on metrics
    const getAlertLevel = useCallback((log) => {
        const concerns = []

        if (log.sleep_hours < 6) concerns.push('low sleep')
        if (log.sleep_quality <= 2) concerns.push('poor sleep quality')
        if (log.energy_level <= 2) concerns.push('low energy')
        if (log.muscle_soreness >= 4) concerns.push('high soreness')
        if (log.stress_level >= 4) concerns.push('high stress')
        if (log.mood === 'poor' || log.mood === 'terrible') concerns.push('low mood')

        return {
            level: concerns.length >= 3 ? 'high' : concerns.length >= 1 ? 'medium' : 'low',
            concerns
        }
    }, [])

    return {
        logs,
        players,
        loading,
        lastUpdate,
        newLogId,
        getPlayerName,
        getAlertLevel,
        refreshData: loadData
    }
}

export default useRealtimeWellness
