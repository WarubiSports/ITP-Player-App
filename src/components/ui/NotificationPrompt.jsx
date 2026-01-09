import { useState } from 'react'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import './NotificationPrompt.css'

export default function NotificationPrompt() {
    const { supported, permission, hasAsked, requestPermission } = usePushNotifications()
    const [dismissed, setDismissed] = useState(false)
    const [requesting, setRequesting] = useState(false)

    // Don't show if:
    // - Not supported
    // - Already granted
    // - Already denied (can't ask again)
    // - User dismissed this session
    // - Already asked and denied
    if (!supported || permission === 'granted' || permission === 'denied' || dismissed) {
        return null
    }

    // Check if user dismissed before (session storage for per-session dismiss)
    const sessionDismissed = sessionStorage.getItem('notification_prompt_dismissed')
    if (sessionDismissed) return null

    const handleEnable = async () => {
        setRequesting(true)
        await requestPermission()
        setRequesting(false)
    }

    const handleDismiss = () => {
        setDismissed(true)
        sessionStorage.setItem('notification_prompt_dismissed', 'true')
    }

    return (
        <div className="notification-prompt">
            <div className="notification-prompt-icon">🔔</div>
            <div className="notification-prompt-content">
                <h4>Enable Notifications</h4>
                <p>Get reminders for your tasks and important updates</p>
            </div>
            <div className="notification-prompt-actions">
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleDismiss}
                >
                    Later
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleEnable}
                    disabled={requesting}
                >
                    {requesting ? 'Enabling...' : 'Enable'}
                </button>
            </div>
        </div>
    )
}
