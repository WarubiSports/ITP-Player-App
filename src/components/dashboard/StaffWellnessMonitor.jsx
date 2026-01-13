import React from 'react'
import { useRealtimeWellness } from '../../hooks/useRealtimeWellness'
import ConnectionStatus from '../ui/ConnectionStatus'
import { Moon, Zap, Activity, Brain, AlertTriangle } from 'lucide-react'

const MOOD_CONFIG = {
    excellent: { indicator: 'E', color: '#22C55E', label: 'Excellent' },
    good: { indicator: 'G', color: '#84CC16', label: 'Good' },
    neutral: { indicator: 'N', color: '#F59E0B', label: 'Neutral' },
    okay: { indicator: 'O', color: '#F59E0B', label: 'Okay' },
    tired: { indicator: 'T', color: '#F97316', label: 'Tired' },
    poor: { indicator: 'P', color: '#EF4444', label: 'Poor' },
    terrible: { indicator: '!', color: '#EF4444', label: 'Terrible' }
}

const ALERT_COLORS = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#22C55E'
}

/**
 * Staff-only component for monitoring player wellness in real-time
 * Shows a live feed of wellness check-ins with alert indicators
 */
export default function StaffWellnessMonitor({ maxItems = 10 }) {
    const { logs, loading, newLogId, getPlayerName, getAlertLevel } = useRealtimeWellness({
        showNotifications: true,
        limit: maxItems
    })

    const formatTime = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    Loading wellness data...
                </div>
            </div>
        )
    }

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Wellness Monitor
                </h3>
                <ConnectionStatus showLabel />
            </div>

            {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                    <Activity size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ marginTop: '0.5rem' }}>No wellness logs yet today</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {logs.map((log) => {
                        const mood = MOOD_CONFIG[log.mood] || MOOD_CONFIG.neutral
                        const alert = getAlertLevel(log)
                        const isNew = log.id === newLogId

                        return (
                            <div
                                key={log.id}
                                className={isNew ? 'slide-in-animation' : ''}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    background: isNew ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${ALERT_COLORS[alert.level]}`,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {/* Mood indicator */}
                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: `${mood.color}20`,
                                    borderRadius: '50%',
                                    color: mood.color
                                }}>
                                    {mood.indicator}
                                </div>

                                {/* Player info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                                        {log.player ? `${log.player.first_name} ${log.player.last_name}` : getPlayerName(log.player_id)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <Moon size={12} /> {log.sleep_hours}h
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <Zap size={12} /> {log.energy_level}/10
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <Activity size={12} /> {log.muscle_soreness}/10
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <Brain size={12} /> {log.stress_level}/10
                                        </span>
                                    </div>
                                    {alert.concerns.length > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: ALERT_COLORS[alert.level], marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <AlertTriangle size={12} /> {alert.concerns.join(', ')}
                                        </div>
                                    )}
                                </div>

                                {/* Time */}
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                                    {formatTime(log.created_at || log.date)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
