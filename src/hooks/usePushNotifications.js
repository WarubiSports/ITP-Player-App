import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getChores } from '../lib/data-service'
import {
    isNotificationSupported,
    getPermissionStatus,
    requestPermission,
    hasAskedPermission,
    checkAndSendChoreReminders,
    clearOldNotificationRecords
} from '../services/pushNotificationService'

export function usePushNotifications() {
    const { profile } = useAuth()
    const [permission, setPermission] = useState(getPermissionStatus())
    const [supported] = useState(isNotificationSupported())
    const [hasAsked, setHasAsked] = useState(hasAskedPermission())

    // Update permission status
    useEffect(() => {
        setPermission(getPermissionStatus())
    }, [])

    // Request permission
    const requestNotificationPermission = useCallback(async () => {
        const result = await requestPermission()
        setPermission(result)
        setHasAsked(true)
        return result
    }, [])

    // Check for chore reminders
    const checkChoreReminders = useCallback(async () => {
        if (permission !== 'granted' || !profile?.id) return []

        try {
            const chores = await getChores()
            const playerId = profile.id

            // Clean up old records
            clearOldNotificationRecords()

            // Send reminders
            return checkAndSendChoreReminders(chores, playerId)
        } catch (error) {
            console.error('Error checking chore reminders:', error)
            return []
        }
    }, [permission, profile?.id])

    // Auto-check reminders on mount and periodically
    useEffect(() => {
        if (permission !== 'granted' || !profile?.id) return

        // Check immediately
        checkChoreReminders()

        // Check every 30 minutes
        const interval = setInterval(checkChoreReminders, 30 * 60 * 1000)

        return () => clearInterval(interval)
    }, [permission, profile?.id, checkChoreReminders])

    return {
        supported,
        permission,
        hasAsked,
        isEnabled: permission === 'granted',
        requestPermission: requestNotificationPermission,
        checkChoreReminders
    }
}
