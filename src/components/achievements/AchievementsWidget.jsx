import React, { useState, useEffect } from 'react'
import { getPlayerAchievementsWithDetails, checkAndUnlockAchievements } from '../../lib/data-service'
import AchievementBadge, { AchievementUnlockToast } from './AchievementBadge'
import Confetti from '../celebrations/Confetti'
import './AchievementsWidget.css'

export default function AchievementsWidget({ playerId, showAll = false, onAchievementUnlock }) {
    const [achievements, setAchievements] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAllAchievements, setShowAllAchievements] = useState(showAll)
    const [newUnlock, setNewUnlock] = useState(null)
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        loadAchievements()
    }, [playerId])

    const loadAchievements = async () => {
        try {
            // Check for new achievements first
            const newlyUnlocked = await checkAndUnlockAchievements(playerId)

            if (newlyUnlocked.length > 0) {
                // Show celebration for the first one
                setNewUnlock(newlyUnlocked[0])
                setShowConfetti(true)
                onAchievementUnlock?.(newlyUnlocked)
            }

            // Load all achievements
            const data = await getPlayerAchievementsWithDetails(playerId)
            setAchievements(data)
        } catch (error) {
            console.error('Error loading achievements:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCloseToast = () => {
        setNewUnlock(null)
    }

    if (loading) {
        return (
            <div className="achievements-widget achievements-widget--loading">
                <h3 className="achievements-widget__title">Achievements</h3>
                <p className="achievements-widget__loading">Loading achievements...</p>
            </div>
        )
    }

    const unlockedCount = achievements.filter(a => a.unlocked).length
    const displayAchievements = showAllAchievements
        ? achievements
        : achievements.filter(a => a.unlocked).slice(0, 3)

    // Sort: unlocked first, then by rarity
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
    const sortedAchievements = [...displayAchievements].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1
        return (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5)
    })

    return (
        <>
            <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

            {newUnlock && (
                <AchievementUnlockToast
                    achievement={newUnlock}
                    onClose={handleCloseToast}
                />
            )}

            <div className="achievements-widget">
                <div className="achievements-widget__header">
                    <h3 className="achievements-widget__title">
                        Achievements
                        <span className="achievements-widget__count">
                            {unlockedCount}/{achievements.length}
                        </span>
                    </h3>

                    {achievements.length > 3 && (
                        <button
                            className="achievements-widget__toggle"
                            onClick={() => setShowAllAchievements(!showAllAchievements)}
                        >
                            {showAllAchievements ? 'Show Less' : 'View All'}
                        </button>
                    )}
                </div>

                {unlockedCount === 0 ? (
                    <div className="achievements-widget__empty">
                        <span className="achievements-widget__empty-icon">🏆</span>
                        <p>No achievements yet!</p>
                        <p className="achievements-widget__empty-hint">
                            Keep logging your wellness to earn your first badge.
                        </p>
                    </div>
                ) : (
                    <div className={`achievements-widget__grid ${showAllAchievements ? 'achievements-widget__grid--expanded' : ''}`}>
                        {sortedAchievements.map(achievement => (
                            <AchievementBadge
                                key={achievement.id}
                                achievement={achievement}
                                size={showAllAchievements ? 'medium' : 'small'}
                            />
                        ))}

                        {!showAllAchievements && achievements.filter(a => !a.unlocked).length > 0 && (
                            <div
                                className="achievements-widget__more"
                                onClick={() => setShowAllAchievements(true)}
                            >
                                <span className="achievements-widget__more-icon">🔒</span>
                                <span className="achievements-widget__more-text">
                                    +{achievements.filter(a => !a.unlocked).length} more to unlock
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Progress bar */}
                <div className="achievements-widget__progress">
                    <div
                        className="achievements-widget__progress-bar"
                        style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                    />
                </div>
            </div>
        </>
    )
}
