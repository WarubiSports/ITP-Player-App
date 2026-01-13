import React, { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext()

export function useNotification() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider')
    }
    return context
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])

    const addNotification = useCallback((message, type = 'info', duration = 3000, iconType = null) => {
        const id = Date.now() + Math.random()
        const notification = { id, message, type, duration, iconType }

        setNotifications(prev => [...prev, notification])

        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }, duration)
        }

        return id
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const success = useCallback((message, duration) => {
        return addNotification(message, 'success', duration)
    }, [addNotification])

    const error = useCallback((message, duration) => {
        return addNotification(message, 'error', duration)
    }, [addNotification])

    const info = useCallback((message, duration) => {
        return addNotification(message, 'info', duration)
    }, [addNotification])

    const warning = useCallback((message, duration) => {
        return addNotification(message, 'warning', duration)
    }, [addNotification])

    const achievement = useCallback((title, message, duration = 5000) => {
        const fullMessage = `${title}: ${message}`
        return addNotification(fullMessage, 'achievement', duration, 'achievement')
    }, [addNotification])

    // Realtime notifications with source-specific icons
    const realtime = useCallback((message, source = 'info', duration = 5000) => {
        return addNotification(message, 'realtime', duration, source)
    }, [addNotification])

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            showNotification: addNotification, // Alias for backwards compatibility
            removeNotification,
            success,
            error,
            info,
            warning,
            achievement,
            realtime
        }}>
            {children}
        </NotificationContext.Provider>
    )
}
