import React, { useState, useEffect } from 'react'
import { getWellnessStreak } from '../../lib/data-service'
import { Flame, Moon, AlertTriangle, Check } from 'lucide-react'
import './StreakWidget.css'

export default function StreakWidget({ playerId, onStreakChange }) {
    const [streak, setStreak] = useState({ current: 0, longest: 0, todayLogged: false })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStreak()
    }, [playerId])

    const loadStreak = async () => {
        try {
            const data = await getWellnessStreak(playerId)
            setStreak(data)
            onStreakChange?.(data)
        } catch (error) {
            console.error('Error loading streak:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="glass-panel streak-widget streak-widget--loading">
                <div className="streak-widget__icon">--</div>
                <div className="streak-widget__content">
                    <span className="streak-widget__label">Wellness Streak</span>
                    <span className="streak-widget__value">Loading...</span>
                </div>
            </div>
        )
    }

    const { current, longest, todayLogged } = streak

    // Determine status
    const getStatus = () => {
        if (current >= 30) return { label: 'Legendary!', class: 'legendary' }
        if (current >= 14) return { label: 'On Fire!', class: 'fire' }
        if (current >= 7) return { label: 'Great Streak!', class: 'great' }
        if (current >= 3) return { label: 'Building!', class: 'building' }
        if (current > 0) return { label: 'Started', class: 'started' }
        return { label: 'Start Today', class: 'none' }
    }

    const status = getStatus()

    // Check if player just hit a milestone (exact match)
    const isMilestoneHit = current === 7 || current === 14 || current === 30

    return (
        <div className={`glass-panel streak-widget streak-widget--${status.class} ${todayLogged ? 'streak-widget--logged' : ''} ${isMilestoneHit ? 'streak-widget--milestone-hit' : ''}`}>
            <div className="streak-widget__main">
                <div className="streak-widget__icon-wrapper">
                    <span className="streak-widget__icon">{current > 0 ? <Flame size={28} /> : <Moon size={28} />}</span>
                </div>
                <div className="streak-widget__content">
                    <span className="streak-widget__label">Wellness Streak</span>
                    <div className="streak-widget__value-row">
                        <span className="streak-widget__value">{current}</span>
                        <span className="streak-widget__unit">days</span>
                        <span className={`streak-widget__status streak-widget__status--${status.class}`}>
                            {status.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress bar to next milestone */}
            <div className="streak-widget__progress-section">
                <div className="streak-widget__progress-track">
                    <div
                        className="streak-widget__progress-fill"
                        style={{ width: `${Math.min((current / 30) * 100, 100)}%` }}
                    />
                    <div className="streak-widget__milestones">
                        <span className={`streak-widget__milestone ${current >= 7 ? 'achieved' : ''}`} style={{ left: `${(7/30)*100}%` }}>7</span>
                        <span className={`streak-widget__milestone ${current >= 14 ? 'achieved' : ''}`} style={{ left: `${(14/30)*100}%` }}>14</span>
                        <span className={`streak-widget__milestone ${current >= 30 ? 'achieved' : ''}`} style={{ left: '100%' }}>30</span>
                    </div>
                </div>
            </div>

            {/* Status message */}
            <div className="streak-widget__message">
                {current === 0 && (
                    <span className="streak-widget__msg streak-widget__msg--cta">
                        Log your wellness to start a streak
                    </span>
                )}
                {current > 0 && !todayLogged && (
                    <span className="streak-widget__msg streak-widget__msg--warning">
                        <AlertTriangle size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        Log today to maintain your streak
                    </span>
                )}
                {todayLogged && current > 0 && (
                    <span className="streak-widget__msg streak-widget__msg--success">
                        <Check size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        Today logged • Best: {longest} days
                    </span>
                )}
            </div>
        </div>
    )
}
