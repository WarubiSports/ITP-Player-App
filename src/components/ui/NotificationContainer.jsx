import React from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import { Check, X, AlertTriangle, Info, Trophy, Calendar, Star, CheckCircle, Dumbbell, Bell } from 'lucide-react'
import './NotificationContainer.css'

const getNotificationIcon = (type, iconType) => {
    const iconSize = 16

    // Handle realtime notifications with specific icon types
    if (type === 'realtime' && iconType) {
        switch (iconType) {
            case 'event': return <Calendar size={iconSize} />
            case 'points': return <Star size={iconSize} />
            case 'chore': return <CheckCircle size={iconSize} />
            case 'wellness': return <Dumbbell size={iconSize} />
            case 'info':
            default: return <Bell size={iconSize} />
        }
    }

    // Standard notification types
    switch (type) {
        case 'success': return <Check size={iconSize} />
        case 'error': return <X size={iconSize} />
        case 'warning': return <AlertTriangle size={iconSize} />
        case 'info': return <Info size={iconSize} />
        case 'achievement': return <Trophy size={iconSize} />
        default: return <Bell size={iconSize} />
    }
}

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
                        {getNotificationIcon(notification.type, notification.iconType)}
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
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    )
}
