import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPlayerEvents } from '../../lib/data-service'
import { startNotificationService, stopNotificationService } from '../../services/eventNotificationService'
import { useNotification } from '../../contexts/NotificationContext'
import './EventNotifications.css'

export default function EventNotifications() {
    const { profile } = useAuth()
    const { showNotification } = useNotification()
    const [playerId, setPlayerId] = useState(null)

    useEffect(() => {
        // Get player ID from profile
        const fetchPlayerId = async () => {
            if (!profile?.id) return

            try {
                // Check if user is a player
                const { getPlayers } = await import('../../lib/data-service')
                const players = await getPlayers()
                const player = players.find(p => p.user_id === profile.id || p.id === profile.id)

                if (player) {
                    setPlayerId(player.id)
                }
            } catch (error) {
                console.error('Error fetching player ID:', error)
            }
        }

        fetchPlayerId()
    }, [profile])

    useEffect(() => {
        if (!playerId) return

        // Start notification service
        startNotificationService(
            playerId,
            getPlayerEvents,
            (notification) => {
                // Show notification to user
                showNotification(
                    `⏰ ${notification.message}${notification.location ? ` at ${notification.location}` : ''}`,
                    'info'
                )
            }
        )

        return () => {
            stopNotificationService()
        }
    }, [playerId, showNotification])

    // This component doesn't render anything visible
    return null
}
