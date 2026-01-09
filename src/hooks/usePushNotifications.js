import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getChores, getPlayerEvents, getWellnessLogs, getPlayerGoals, getWellnessStreak } from '../lib/data-service'
import {
    isNotificationSupported,
    getPermissionStatus,
    requestPermission,
    hasAskedPermission,
    checkAndSendChoreReminders,
    checkAndSendEventReminders,
    checkAndSendWellnessReminder,
    checkAndSendGoalReminders,
    checkAndSendStreakReminder,
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
            return checkAndSendChoreReminders(chores, playerId)
        } catch (error) {
            console.error('Error checking chore reminders:', error)
            return []
        }
    }, [permission, profile?.id])

    // Check for event/practice reminders
    const checkEventReminders = useCallback(async () => {
        if (permission !== 'granted' || !profile?.id) return []

        try {
            const events = await getPlayerEvents(profile.id)
            return checkAndSendEventReminders(events, profile.id)
        } catch (error) {
            console.error('Error checking event reminders:', error)
            return []
        }
    }, [permission, profile?.id])

    // Check for wellness reminders
    const checkWellnessReminders = useCallback(async () => {
        if (permission !== 'granted' || !profile?.id) return null

        try {
            const logs = await getWellnessLogs(profile.id, 1)
            const today = new Date().toISOString().split('T')[0]
            const hasLoggedToday = logs.some(log => log.date === today)
            return checkAndSendWellnessReminder(hasLoggedToday)
        } catch (error) {
            console.error('Error checking wellness reminders:', error)
            return null
        }
    }, [permission, profile?.id])

    // Check for goal reminders
    const checkGoalReminders = useCallback(async () => {
        if (permission !== 'granted' || !profile?.id) return []

        try {
            const goals = await getPlayerGoals(profile.id)
            return checkAndSendGoalReminders(goals, profile.id)
        } catch (error) {
            console.error('Error checking goal reminders:', error)
            return []
        }
    }, [permission, profile?.id])

    // Check for streak reminders
    const checkStreakReminders = useCallback(async () => {
        if (permission !== 'granted' || !profile?.id) return null

        try {
            const streak = await getWellnessStreak(profile.id)
            const logs = await getWellnessLogs(profile.id, 1)
            const today = new Date().toISOString().split('T')[0]
            const hasLoggedToday = logs.some(log => log.date === today)
            return checkAndSendStreakReminder(streak, hasLoggedToday)
        } catch (error) {
            console.error('Error checking streak reminders:', error)
            return null
        }
    }, [permission, profile?.id])

    // Check all reminders
    const checkAllReminders = useCallback(async () => {
        if (permission !== 'granted' || !profile?.id) return

        // Clean up old records first
        clearOldNotificationRecords()

        // Check all reminder types in parallel
        await Promise.all([
            checkChoreReminders(),
            checkEventReminders(),
            checkWellnessReminders(),
            checkGoalReminders(),
            checkStreakReminders()
        ])
    }, [permission, profile?.id, checkChoreReminders, checkEventReminders, checkWellnessReminders, checkGoalReminders, checkStreakReminders])

    // Auto-check reminders on mount and periodically
    useEffect(() => {
        if (permission !== 'granted' || !profile?.id) return

        // Check immediately
        checkAllReminders()

        // Check every 15 minutes (more frequent to catch time-sensitive reminders)
        const interval = setInterval(checkAllReminders, 15 * 60 * 1000)

        return () => clearInterval(interval)
    }, [permission, profile?.id, checkAllReminders])

    return {
        supported,
        permission,
        hasAsked,
        isEnabled: permission === 'granted',
        requestPermission: requestNotificationPermission,
        checkAllReminders,
        checkChoreReminders,
        checkEventReminders,
        checkWellnessReminders,
        checkGoalReminders,
        checkStreakReminders
    }
}
