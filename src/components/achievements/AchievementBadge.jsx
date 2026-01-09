import React from 'react'
import './AchievementBadge.css'

const RARITY_CONFIG = {
    common: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
    uncommon: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
    rare: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
    epic: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
    legendary: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' }
}

export default function AchievementBadge({
    achievement,
    size = 'medium',
    showDetails = true,
    onClick
}) {
    const { icon, name, description, rarity, unlocked } = achievement
    const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common

    return (
        <div
            className={`achievement-card achievement-card--${size} ${unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
            onClick={onClick}
            style={{
                '--rarity-color': config.color,
                '--rarity-bg': config.bg,
            }}
        >
            {/* Icon */}
            <div className="achievement-card__icon-container">
                <span className="achievement-card__icon">{icon}</span>
                {!unlocked && (
                    <div className="achievement-card__lock">🔒</div>
                )}
            </div>

            {showDetails && (
                <div className="achievement-card__details">
                    <h4 className="achievement-card__name">{name}</h4>
                    <p className="achievement-card__description">{description}</p>
                    <span className="achievement-card__rarity-tag">{rarity}</span>
                </div>
            )}
        </div>
    )
}

export function AchievementUnlockToast({ achievement, onClose }) {
    const config = RARITY_CONFIG[achievement.rarity] || RARITY_CONFIG.common

    return (
        <div
            className="achievement-toast"
            style={{ '--rarity-color': config.color }}
        >
            <div className="achievement-toast__content">
                <div className="achievement-toast__header">
                    <span className="achievement-toast__badge">⭐ UNLOCKED</span>
                </div>
                <div className="achievement-toast__body">
                    <div className="achievement-toast__icon-wrap">
                        <span className="achievement-toast__icon">{achievement.icon}</span>
                    </div>
                    <div className="achievement-toast__info">
                        <h4 className="achievement-toast__name">{achievement.name}</h4>
                        <span className="achievement-toast__rarity">{achievement.rarity}</span>
                    </div>
                </div>
            </div>
            <button className="achievement-toast__close" onClick={onClose}>✕</button>
        </div>
    )
}
