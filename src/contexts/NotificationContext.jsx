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

    const addNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random()
        const notification = { id, message, type, duration }

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

    const achievement = useCallback((title, message, icon = '🏆', duration = 5000) => {
        const fullMessage = `${icon} ${title}: ${message}`
        return addNotification(fullMessage, 'achievement', duration)
    }, [addNotification])

    return (
        <NotificationContext.Provider value={{
            notifications,
            addNotification,
            removeNotification,
            success,
            error,
            info,
            warning,
            achievement
        }}>
            {children}
        </NotificationContext.Provider>
    )
}
