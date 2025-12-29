import React, { useState } from 'react'
import ReadinessGauge from '../components/dashboard/ReadinessGauge'
import NextObjective from '../components/dashboard/NextObjective'
import LiveLeaderboard from '../components/dashboard/LiveLeaderboard'
import Marketplace from '../components/gamification/Marketplace'
import DailyCheckIn from '../components/performance/DailyCheckIn'
import './Dashboard.css'

export default function Dashboard() {
    const [showMarket, setShowMarket] = useState(false);
    const [showCheckIn, setShowCheckIn] = useState(false);

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

            {/* Top Row: Critical Status */}
            <div className="dashboard-top-grid">
                <div className="dashboard-gauges">
                    <ReadinessGauge score={88} />
                    <NextObjective />
                </div>
                <LiveLeaderboard />
            </div>

            {/* Middle Row: Quick Actions & Stats */}
            <div className="dashboard-actions-grid">
                {/* Wallet Widget */}
                <div className="glass-panel dashboard-widget" onClick={() => setShowMarket(true)}>
                    <h3 className="widget-title">Wallet</h3>
                    <div className="widget-value widget-value-accent">
                        2,450 <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>GC</span>
                    </div>
                    <div className="widget-change widget-change-positive">+150 this week</div>
                    <div className="widget-link">Open Store →</div>
                </div>

                {/* Training Load */}
                <div className="glass-panel dashboard-widget" onClick={() => setShowCheckIn(true)}>
                    <h3 className="widget-title">Training Load</h3>
                    <div className="widget-value">High</div>
                    <div className="widget-progress-bar">
                        <div className="widget-progress-fill" style={{ width: '80%' }}></div>
                    </div>
                    <div className="widget-link">Log Daily Stats →</div>
                </div>

                {/* Sleep Tracker */}
                <div className="glass-panel dashboard-widget">
                    <h3 className="widget-title">Sleep Avg</h3>
                    <div className="widget-value">7h 45m</div>
                    <div className="widget-change widget-change-warning">Below Target (8h)</div>
                </div>
            </div>

            {showMarket && <Marketplace onClose={() => setShowMarket(false)} />}
            {showCheckIn && <DailyCheckIn onClose={() => setShowCheckIn(false)} />}
        </div>
    )
}
