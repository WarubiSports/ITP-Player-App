import React, { useState, useEffect } from 'react'
import { getWellnessStreak } from '../../lib/data-service'
import './StreakWidget.css'

export default function StreakWidget({ playerId, onStreakChange }) {
    const [streak, setStreak] = useState({ current: 0, longest: 0, todayLogged: false })
    const [loading, setLoading] = useState(true)
    const [animatedCount, setAnimatedCount] = useState(0)

    useEffect(() => {
        loadStreak()
    }, [playerId])

    // Animate the counter
    useEffect(() => {
        if (streak.current > 0 && animatedCount < streak.current) {
            const timer = setTimeout(() => {
                setAnimatedCount(prev => Math.min(prev + 1, streak.current))
            }, 80)
            return () => clearTimeout(timer)
        }
    }, [streak.current, animatedCount])

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
            <div className="streak-meter streak-meter--loading">
                <div className="streak-meter__core">
                    <div className="streak-meter__ring streak-meter__ring--outer" />
                    <div className="streak-meter__ring streak-meter__ring--inner" />
                    <div className="streak-meter__value">
                        <span className="streak-meter__number">--</span>
                    </div>
                </div>
            </div>
        )
    }

    const { current, longest, todayLogged } = streak
    const isOnFire = current >= 3
    const isPowerMode = current >= 7
    const progress = Math.min((current / 30) * 100, 100)
    const circumference = 2 * Math.PI * 54

    // Determine power level
    const getPowerLevel = () => {
        if (current >= 30) return { level: 'LEGENDARY', class: 'legendary' }
        if (current >= 14) return { level: 'ELITE', class: 'elite' }
        if (current >= 7) return { level: 'RISING', class: 'rising' }
        if (current >= 3) return { level: 'ACTIVE', class: 'active' }
        if (current > 0) return { level: 'STARTING', class: 'starting' }
        return { level: 'OFFLINE', class: 'offline' }
    }

    const powerLevel = getPowerLevel()

    return (
        <div className={`streak-meter streak-meter--${powerLevel.class} ${todayLogged ? 'streak-meter--logged' : ''}`}>
            {/* Background energy field */}
            <div className="streak-meter__energy-field">
                <div className="energy-particle" style={{ '--delay': '0s', '--x': '20%', '--y': '30%' }} />
                <div className="energy-particle" style={{ '--delay': '0.5s', '--x': '80%', '--y': '20%' }} />
                <div className="energy-particle" style={{ '--delay': '1s', '--x': '60%', '--y': '70%' }} />
                <div className="energy-particle" style={{ '--delay': '1.5s', '--x': '30%', '--y': '80%' }} />
            </div>

            {/* Main power gauge */}
            <div className="streak-meter__gauge">
                <div className="streak-meter__core">
                    {/* SVG Ring Progress */}
                    <svg className="streak-meter__svg" viewBox="0 0 120 120">
                        {/* Background track */}
                        <circle
                            className="streak-meter__track"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            strokeWidth="6"
                        />
                        {/* Progress arc */}
                        <circle
                            className="streak-meter__progress"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            strokeWidth="6"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: circumference - (progress / 100) * circumference
                            }}
                        />
                        {/* Glow effect */}
                        <circle
                            className="streak-meter__glow"
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: circumference - (progress / 100) * circumference
                            }}
                        />
                    </svg>

                    {/* Center content */}
                    <div className="streak-meter__center">
                        <div className="streak-meter__icon">
                            {current === 0 ? (
                                <span className="streak-meter__icon-dormant">◇</span>
                            ) : (
                                <span className="streak-meter__icon-active">⬡</span>
                            )}
                        </div>
                        <div className="streak-meter__value">
                            <span className="streak-meter__number">{animatedCount}</span>
                            <span className="streak-meter__unit">DAYS</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info panel */}
            <div className="streak-meter__info">
                <div className="streak-meter__header">
                    <span className="streak-meter__label">STREAK POWER</span>
                    <span className={`streak-meter__status streak-meter__status--${powerLevel.class}`}>
                        {powerLevel.level}
                    </span>
                </div>

                {/* Milestone progress bar */}
                <div className="streak-meter__milestones">
                    <div className="milestone-track">
                        <div className="milestone-track__fill" style={{ width: `${progress}%` }} />
                        <div className={`milestone-marker ${current >= 7 ? 'milestone-marker--achieved' : ''}`} style={{ left: `${(7/30)*100}%` }}>
                            <span className="milestone-marker__dot" />
                            <span className="milestone-marker__label">7</span>
                        </div>
                        <div className={`milestone-marker ${current >= 14 ? 'milestone-marker--achieved' : ''}`} style={{ left: `${(14/30)*100}%` }}>
                            <span className="milestone-marker__dot" />
                            <span className="milestone-marker__label">14</span>
                        </div>
                        <div className={`milestone-marker ${current >= 30 ? 'milestone-marker--achieved' : ''}`} style={{ left: '100%' }}>
                            <span className="milestone-marker__dot" />
                            <span className="milestone-marker__label">30</span>
                        </div>
                    </div>
                </div>

                {/* Status message */}
                <div className="streak-meter__message">
                    {current === 0 && (
                        <span className="message message--cta">
                            <span className="message__icon">▶</span>
                            Initialize streak sequence
                        </span>
                    )}
                    {current > 0 && !todayLogged && (
                        <span className="message message--warning">
                            <span className="message__pulse" />
                            Log today to maintain power
                        </span>
                    )}
                    {todayLogged && current > 0 && (
                        <span className="message message--success">
                            <span className="message__icon">✓</span>
                            Power sustained • Best: {longest}d
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
