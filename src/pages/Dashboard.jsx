import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDemoData } from '../lib/supabase'
import { getPlayers, getWellnessScore, getTrainingLoads } from '../lib/data-service'
import ReadinessGauge from '../components/dashboard/ReadinessGauge'
import NextObjective from '../components/dashboard/NextObjective'
import SmartGuidance from '../components/dashboard/SmartGuidance'
import DailyCheckIn from '../components/performance/DailyCheckIn'
import GoalsWidget from '../components/goals/GoalsWidget'
import StreakWidget from '../components/achievements/StreakWidget'
import AchievementsWidget from '../components/achievements/AchievementsWidget'
import NotificationPrompt from '../components/ui/NotificationPrompt'
import './Dashboard.css'

export default function Dashboard() {
    const { profile } = useAuth();
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [playerData, setPlayerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [readinessScore, setReadinessScore] = useState(50);
    const [trainingLoad, setTrainingLoad] = useState('Medium');
    const [sleepAverage, setSleepAverage] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (profile?.id) {
            loadDashboardData();
        }
    }, [profile?.id, showCheckIn]); // Refresh when modal closes

    // Trigger refresh of SmartGuidance when check-in closes
    const prevShowCheckIn = React.useRef(showCheckIn);
    useEffect(() => {
        if (prevShowCheckIn.current && !showCheckIn) {
            // Check-in modal just closed - refresh SmartGuidance
            setTimeout(() => setRefreshKey(prev => prev + 1), 100);
        }
        prevShowCheckIn.current = showCheckIn;
    }, [showCheckIn]);

    const loadDashboardData = async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);
            // Get player data
            const players = await getPlayers();
            let player = players.find(p => p.id === profile.id || p.user_id === profile.id);

            // If player not found and user has player role, try demo data fallback
            if (!player && profile.role === 'player') {
                const data = getDemoData();
                player = data.players.find(p => p.id === profile.id || p.user_id === profile.id);
            }

            setPlayerData(player || false); // false means not a player, null means loading

            if (player && player.id) {
                // Get wellness score (7-day average)
                const wellnessData = await getWellnessScore(player.id);
                if (wellnessData) {
                    setReadinessScore(wellnessData.score);
                    const avgSleep = wellnessData.average.sleep_quality;
                    setSleepAverage(avgSleep.toFixed(1)); // Sleep quality on 1-5 scale
                }

                // Get training load (7-day total)
                const loads = await getTrainingLoads(player.id, 7);
                if (loads && loads.length > 0) {
                    const totalLoad = loads.reduce((sum, load) => sum + (load.load_score || 0), 0);
                    if (totalLoad > 4000) setTrainingLoad('Very High');
                    else if (totalLoad > 2500) setTrainingLoad('High');
                    else if (totalLoad > 1500) setTrainingLoad('Medium');
                    else setTrainingLoad('Low');
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Fallback to demo data
            const data = getDemoData();
            const player = data.players.find(p => p.id === profile.id);
            setPlayerData(player || false);
        } finally {
            setLoading(false);
        }
    }

    // Don't render until we know user type (playerData must be false or object, never null)
    if (playerData === null) {
        return (
            <div className="dashboard-page">
                <header className="dashboard-header">
                    <div className="dashboard-title-section">
                        <h1>MISSION CONTROL</h1>
                        <p>Loading...</p>
                    </div>
                </header>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-title-section">
                    <h1>MISSION CONTROL</h1>
                    <p>Welcome back, Pilot. Systems Nominal.</p>
                </div>
                <div className="glass-panel dashboard-status">
                    <span className="status-dot"></span>
                    <span className="status-text">ONLINE</span>
                </div>
            </header>

            {/* Notification Permission Prompt (only for players) */}
            {playerData && playerData.id && <NotificationPrompt />}

            {/* Smart Guidance - Personalized Next Steps (only for players) */}
            {playerData && playerData.id && <SmartGuidance key={refreshKey} playerId={playerData.id} />}

            {/* Streak & Achievements Section (only for players) */}
            {playerData && playerData.id && (
                <div className="dashboard-streak-section">
                    <StreakWidget key={`streak-${refreshKey}`} playerId={playerData.id} />
                </div>
            )}

            {/* Staff View Message (only for staff - playerData === false) */}
            {playerData === false && (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: '0 0 1rem 0' }}>👥 Staff Dashboard</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Welcome, Max! As a staff member, you have access to administrative features.
                    </p>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
                        Navigate to Players, Housing, or Admin sections using the sidebar to manage the program.
                    </p>
                </div>
            )}

            {/* Player Dashboard - Only shown for players (playerData is object with id) */}
            {playerData && playerData.id && (
                <>
                    {/* Top Row: Critical Status */}
                    <div className="dashboard-top-grid">
                        <div className="dashboard-gauges">
                            <ReadinessGauge score={readinessScore} />
                            <NextObjective />
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="dashboard-actions-grid">
                        {/* Training Load */}
                        <div className="glass-panel dashboard-widget" onClick={() => setShowCheckIn(true)}>
                            <h3 className="widget-title">Training Load (7d)</h3>
                            <div className="widget-value">{trainingLoad}</div>
                            <div className="widget-progress-bar">
                                <div className="widget-progress-fill" style={{
                                    width: trainingLoad === 'Very High' ? '95%' :
                                           trainingLoad === 'High' ? '75%' :
                                           trainingLoad === 'Medium' ? '50%' : '30%'
                                }}></div>
                            </div>
                            <div className="widget-link">Log Daily Stats →</div>
                        </div>

                        {/* Sleep Tracker */}
                        <div className="glass-panel dashboard-widget">
                            <h3 className="widget-title">Sleep Quality (7d)</h3>
                            <div className="widget-value">
                                {sleepAverage ? `${sleepAverage}/5.0` : 'No data'}
                            </div>
                            <div className="widget-change widget-change-warning">
                                {sleepAverage && parseFloat(sleepAverage) >= 4 ? 'Excellent Recovery' :
                                 sleepAverage && parseFloat(sleepAverage) >= 3 ? 'Good Recovery' :
                                 sleepAverage ? 'Below Target' : 'Log your wellness'}
                            </div>
                        </div>
                    </div>

                    {/* Goals & Achievements Row */}
                    <div className="dashboard-goals-achievements">
                        <GoalsWidget playerId={playerData.id} />
                        <AchievementsWidget key={`achievements-${refreshKey}`} playerId={playerData.id} />
                    </div>

                    {showCheckIn && <DailyCheckIn onClose={() => setShowCheckIn(false)} />}
                </>
            )}
        </div>
    )
}
