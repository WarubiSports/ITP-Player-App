import React, { useState } from 'react'
import ReadinessGauge from '../components/dashboard/ReadinessGauge'
import NextObjective from '../components/dashboard/NextObjective'
import LiveLeaderboard from '../components/dashboard/LiveLeaderboard'
import Marketplace from '../components/gamification/Marketplace'
import DailyCheckIn from '../components/performance/DailyCheckIn'

export default function Dashboard() {
    const [showMarket, setShowMarket] = useState(false);
    const [showCheckIn, setShowCheckIn] = useState(false);
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        margin: 0,
                        background: 'linear-gradient(to right, #fff, #A0A0B0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        MISSION CONTROL
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                        Welcome back, Pilot. Systems Nominal.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', background: '#00E5FF', borderRadius: '50%', boxShadow: '0 0 8px #00E5FF' }}></span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '1px' }}>ONLINE</span>
                </div>
            </header>

            {/* Top Row: Critical Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <ReadinessGauge score={88} />
                    <NextObjective />
                </div>
                <LiveLeaderboard />
            </div>

            {/* Middle Row: Quick Actions & Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {/* Wallet Widget */}
                <div className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => setShowMarket(true)}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Wallet</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                        2,450 <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>GC</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginTop: '0.2rem' }}>+150 this week</div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>Open Store →</div>
                </div>

                {/* Training Load */}
                <div className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => setShowCheckIn(true)}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Training Load</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>High</div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '0.5rem', borderRadius: '2px' }}>
                        <div style={{ width: '80%', height: '100%', background: 'var(--color-primary)', borderRadius: '2px', boxShadow: '0 0 10px var(--color-primary)' }}></div>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>Log Daily Stats →</div>
                </div>

                {/* Sleep Tracker */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sleep Avg</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>7h 45m</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '0.2rem' }}>Below Target (8h)</div>
                </div>
            </div>


            {showMarket && <Marketplace onClose={() => setShowMarket(false)} />}
            {showCheckIn && <DailyCheckIn onClose={() => setShowCheckIn(false)} />}
        </div >
    )
}
