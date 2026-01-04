import React, { useState, useRef } from 'react'
import './AchievementBadge.css'

const RARITY_CONFIG = {
    common: {
        gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #64748b 100%)',
        glow: 'rgba(100, 116, 139, 0.5)',
        accent: '#94a3b8'
    },
    uncommon: {
        gradient: 'linear-gradient(135deg, #059669 0%, #34d399 50%, #059669 100%)',
        glow: 'rgba(52, 211, 153, 0.5)',
        accent: '#34d399'
    },
    rare: {
        gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 50%, #2563eb 100%)',
        glow: 'rgba(96, 165, 250, 0.5)',
        accent: '#60a5fa'
    },
    epic: {
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #7c3aed 100%)',
        glow: 'rgba(167, 139, 250, 0.5)',
        accent: '#a78bfa'
    },
    legendary: {
        gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 25%, #fbbf24 50%, #f97316 75%, #dc2626 100%)',
        glow: 'rgba(251, 191, 36, 0.6)',
        accent: '#fbbf24'
    }
}

export default function AchievementBadge({
    achievement,
    size = 'medium',
    showDetails = true,
    onClick
}) {
    const { icon, name, description, rarity, unlocked, points_value } = achievement
    const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common
    const cardRef = useRef(null)
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    const handleMouseMove = (e) => {
        if (!cardRef.current || !unlocked) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setTilt({
            x: (y - 0.5) * 10,
            y: (x - 0.5) * -10
        })
    }

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 })
        setIsHovering(false)
    }

    return (
        <div
            ref={cardRef}
            className={`achievement-card achievement-card--${size} ${unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'} achievement-card--${rarity}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                '--rarity-gradient': config.gradient,
                '--rarity-glow': config.glow,
                '--rarity-accent': config.accent,
                '--tilt-x': `${tilt.x}deg`,
                '--tilt-y': `${tilt.y}deg`,
            }}
        >
            {/* Holographic shimmer overlay */}
            {unlocked && (
                <div className="achievement-card__shimmer" />
            )}

            {/* Card frame */}
            <div className="achievement-card__frame">
                {/* Rarity indicator bar */}
                <div className="achievement-card__rarity-bar" />

                {/* Icon container */}
                <div className="achievement-card__icon-container">
                    <div className="achievement-card__icon-bg" />
                    <span className="achievement-card__icon">{icon}</span>
                    {!unlocked && (
                        <div className="achievement-card__lock">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2m6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 015-5 5 5 0 015 5v2h1m-6-5a3 3 0 00-3 3v2h6V6a3 3 0 00-3-3z"/>
                            </svg>
                        </div>
                    )}
                </div>

                {showDetails && (
                    <div className="achievement-card__details">
                        <h4 className="achievement-card__name">{name}</h4>
                        <p className="achievement-card__description">{description}</p>
                        <div className="achievement-card__footer">
                            <span className="achievement-card__rarity-tag">{rarity}</span>
                            <span className="achievement-card__points">
                                <span className="achievement-card__points-icon">◆</span>
                                {points_value}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Legendary animated border */}
            {rarity === 'legendary' && unlocked && (
                <div className="achievement-card__legendary-border" />
            )}
        </div>
    )
}

export function AchievementUnlockToast({ achievement, onClose }) {
    const config = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common

    return (
        <div
            className={`achievement-toast achievement-toast--${achievement.rarity}`}
            style={{ '--rarity-accent': config.accent, '--rarity-glow': config.glow }}
        >
            <div className="achievement-toast__glow" />

            <div className="achievement-toast__content">
                <div className="achievement-toast__header">
                    <div className="achievement-toast__badge">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        UNLOCKED
                    </div>
                </div>

                <div className="achievement-toast__body">
                    <div className="achievement-toast__icon-wrap">
                        <span className="achievement-toast__icon">{achievement.icon}</span>
                    </div>
                    <div className="achievement-toast__info">
                        <h4 className="achievement-toast__name">{achievement.name}</h4>
                        <div className="achievement-toast__reward">
                            <span className="achievement-toast__points-icon">◆</span>
                            +{achievement.points_value} GC
                        </div>
                    </div>
                </div>
            </div>

            <button className="achievement-toast__close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
                </svg>
            </button>
        </div>
    )
}
