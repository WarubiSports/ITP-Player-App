import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPlayers } from '../lib/data-service'
import ProgressCharts from '../components/analytics/ProgressCharts'
import './Progress.css'

export default function Progress() {
    const { profile } = useAuth()
    const [playerData, setPlayerData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPlayerData()
    }, [profile.id])

    const loadPlayerData = async () => {
        try {
            const players = await getPlayers()
            const player = players.find(p => p.id === profile.id || p.user_id === profile.id)
            setPlayerData(player)
        } catch (error) {
            console.error('Error loading player data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="progress-page">
                <div className="loading-state">Loading your progress...</div>
            </div>
        )
    }

    if (!playerData) {
        return (
            <div className="progress-page">
                <div className="error-state">Player data not found</div>
            </div>
        )
    }

    return (
        <div className="progress-page">
            <header className="page-header">
                <div>
                    <h1>📊 Progress & Analytics</h1>
                    <p>Track your holistic development journey</p>
                </div>
            </header>

            <div className="progress-intro">
                <div className="intro-card">
                    <div className="intro-icon">🎯</div>
                    <div>
                        <h3>Your Development Journey</h3>
                        <p>
                            Success in the 1.FC Köln ITP goes beyond just on-field performance.
                            Track your wellness, training load, athletic performance, and academic progress all in one place.
                        </p>
                    </div>
                </div>
            </div>

            <ProgressCharts playerId={playerData.id} />

            <div className="progress-insights">
                <div className="insight-card">
                    <div className="insight-icon">💡</div>
                    <div>
                        <h4>Keep Logging Daily</h4>
                        <p>Consistent tracking helps identify patterns and optimize your performance</p>
                    </div>
                </div>
                <div className="insight-card">
                    <div className="insight-icon">📈</div>
                    <div>
                        <h4>Focus on Trends</h4>
                        <p>Don't worry about daily fluctuations - look at weekly and monthly trends</p>
                    </div>
                </div>
                <div className="insight-card">
                    <div className="insight-icon">🏆</div>
                    <div>
                        <h4>Celebrate Improvements</h4>
                        <p>Every small improvement adds up to big results over time</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
