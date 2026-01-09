import React from 'react'
import { useRealtime } from '../../contexts/RealtimeContext'

/**
 * Connection status indicator for realtime subscriptions
 * Shows a colored dot with optional label
 */
export default function ConnectionStatus({ showLabel = false, className = '' }) {
    const { connectionState, isDemo, getActiveSubscriptions } = useRealtime()

    // Don't show anything in demo mode
    if (isDemo) {
        return null
    }

    const statusConfig = {
        connected: {
            color: '#22C55E',
            label: 'Live',
            pulse: true
        },
        reconnecting: {
            color: '#F59E0B',
            label: 'Reconnecting...',
            pulse: true
        },
        disconnected: {
            color: '#EF4444',
            label: 'Offline',
            pulse: false
        }
    }

    const config = statusConfig[connectionState] || statusConfig.disconnected
    const activeCount = getActiveSubscriptions()

    return (
        <div
            className={`connection-status ${className}`}
            title={`${config.label}${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-tertiary)'
            }}
        >
            <span
                className={config.pulse ? 'connection-dot-pulse' : ''}
                style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: config.color,
                    boxShadow: config.pulse ? `0 0 8px ${config.color}` : 'none'
                }}
            />
            {showLabel && (
                <span style={{ color: config.color }}>
                    {config.label}
                </span>
            )}
        </div>
    )
}
