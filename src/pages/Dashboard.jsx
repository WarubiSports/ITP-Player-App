import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { demoData } from '../lib/supabase'
import './Dashboard.css'

export default function Dashboard() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalPlayers: 0,
        activeToday: 0,
        pendingChores: 0,
        upcomingEvents: 0
    })
    const [activities, setActivities] = useState([])
    const [houses, setHouses] = useState([])

    useEffect(() => {
        // Load demo data
        const activePlayers = demoData.players.filter(p => p.status === 'active').length
        const pendingChores = demoData.chores.filter(c => c.status === 'pending').length
        const upcomingEvents = demoData.events.length

        setStats({
            totalPlayers: demoData.players.length,
            activeToday: activePlayers,
            pendingChores,
            upcomingEvents
        })

        setActivities([
            { time: '10:30', title: 'Training Session Completed', desc: 'Morning fitness training - 18 players attended', type: 'training' },
            { time: '09:15', title: 'New Player Registration', desc: 'Dennis Huseinbasic completed profile setup', type: 'registration' },
            { time: '08:45', title: 'Chore Completed', desc: 'Laundry Room Clean marked as done', type: 'chores' },
            { time: '08:00', title: 'Weekly Meeting Scheduled', desc: 'Team meeting set for Friday 2pm', type: 'calendar' },
        ])

        setHouses(demoData.houses.map((house, idx) => ({
            ...house,
            rank: idx + 1,
            trophy: ['🥇', '🥈', '🥉'][idx],
            players: demoData.players.filter(p => p.house_id === house.id).length
        })))
    }, [])

    const firstName = profile?.first_name || 'there'

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-content">
                    <h2 className="welcome-title">
                        Welcome back, <span className="text-accent">{firstName}</span> 👋
                    </h2>
                    <p className="welcome-subtitle">
                        Here's what's happening in the Talent Program today
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="glass-card stat-card" onClick={() => navigate('/players')}>
                    <div className="stat-card-icon">⚽</div>
                    <div className="stat-card-value">{stats.totalPlayers}</div>
                    <div className="stat-card-label">Total Players</div>
                    <div className="stat-card-trend up">↑ 2 this month</div>
                </div>
                <div className="glass-card stat-card" onClick={() => navigate('/players')}>
                    <div className="stat-card-icon">🏃</div>
                    <div className="stat-card-value">{stats.activeToday}</div>
                    <div className="stat-card-label">Active Today</div>
                    <div className="stat-card-trend up">All training</div>
                </div>
                <div className="glass-card stat-card" onClick={() => navigate('/chores')}>
                    <div className="stat-card-icon">✅</div>
                    <div className="stat-card-value">{stats.pendingChores}</div>
                    <div className="stat-card-label">Pending Chores</div>
                    <div className="stat-card-trend down">3 overdue</div>
                </div>
                <div className="glass-card stat-card" onClick={() => navigate('/calendar')}>
                    <div className="stat-card-icon">📅</div>
                    <div className="stat-card-value">{stats.upcomingEvents}</div>
                    <div className="stat-card-label">This Week Events</div>
                    <div className="stat-card-trend up">2 tomorrow</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Activity */}
                <div className="glass-card-static activity-section">
                    <div className="section-header">
                        <h3 className="section-title">Recent Activity</h3>
                        <span className="section-badge">Today</span>
                    </div>
                    <div className="activity-list">
                        {activities.map((activity, idx) => (
                            <div key={idx} className="activity-item">
                                <div className="activity-time">{activity.time}</div>
                                <div className="activity-content">
                                    <div className="activity-dot" data-type={activity.type}></div>
                                    <div className="activity-details">
                                        <span className="activity-title">{activity.title}</span>
                                        <span className="activity-desc">{activity.desc}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* House Competition */}
                <div className="glass-card-static competition-section">
                    <div className="section-header">
                        <h3 className="section-title">🏆 House Competition</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/housing')}>View All</button>
                    </div>
                    <div className="house-ranking">
                        {houses.map((house) => (
                            <div key={house.id} className={`house-rank-item rank-${house.rank}`}>
                                <div className="house-rank-trophy">{house.trophy}</div>
                                <div className="house-rank-info">
                                    <span className="house-rank-name">{house.name}</span>
                                    <span className="house-rank-players">{house.players} players</span>
                                </div>
                                <div className="house-rank-points">
                                    <span className="points-value">{house.total_points}</span>
                                    <span className="points-label">pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="competition-footer">
                        <p className="competition-note">
                            🎯 This week: Fitness Challenge (20 pts), Chore Completion (15 pts)
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card-static quick-actions">
                    <div className="section-header">
                        <h3 className="section-title">Quick Actions</h3>
                    </div>
                    <div className="actions-grid">
                        <button className="action-btn" onClick={() => navigate('/players')}>
                            <span className="action-icon">➕</span>
                            <span className="action-label">Add Player</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/chores')}>
                            <span className="action-icon">📝</span>
                            <span className="action-label">Create Chore</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/calendar')}>
                            <span className="action-icon">📅</span>
                            <span className="action-label">Schedule Event</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/housing')}>
                            <span className="action-icon">🏠</span>
                            <span className="action-label">View Housing</span>
                        </button>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="glass-card-static performers-section">
                    <div className="section-header">
                        <h3 className="section-title">⭐ Top Performers</h3>
                    </div>
                    <div className="performers-list">
                        {demoData.players
                            .sort((a, b) => b.points - a.points)
                            .slice(0, 4)
                            .map((player, idx) => (
                                <div key={player.id} className="performer-item">
                                    <div className="performer-rank">{idx + 1}</div>
                                    <div className="avatar avatar-sm">
                                        {player.first_name[0]}{player.last_name[0]}
                                    </div>
                                    <div className="performer-info">
                                        <span className="performer-name">{player.first_name} {player.last_name}</span>
                                        <span className="performer-position">{player.position}</span>
                                    </div>
                                    <div className="performer-points">{player.points} pts</div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
