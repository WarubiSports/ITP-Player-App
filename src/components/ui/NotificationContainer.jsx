import React from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import './NotificationContainer.css'

export default function NotificationContainer() {
    const { notifications, removeNotification } = useNotification()

    return (
        <div className="notification-container">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`notification notification-${notification.type}`}
                    onClick={() => removeNotification(notification.id)}
                >
                    <div className="notification-icon">
                        {notification.type === 'success' && '✓'}
                        {notification.type === 'error' && '✕'}
                        {notification.type === 'warning' && '⚠'}
                        {notification.type === 'info' && 'ℹ'}
                        {notification.type === 'achievement' && '🏆'}
                    </div>
                    <div className="notification-message">{notification.message}</div>
                    <button
                        className="notification-close"
                        onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                        }}
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    )
}
