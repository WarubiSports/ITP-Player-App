import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import './Admin.css'

export default function Admin() {
    const [users, setUsers] = useState([])
    const [applications, setApplications] = useState([])
    const [activeTab, setActiveTab] = useState('users')

    useEffect(() => {
        // Combine users and players for user management
        const allUsers = [
            ...demoData.users.map(u => ({ ...u, type: 'user' })),
            ...demoData.players.map(p => ({
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                role: 'player',
                status: p.status,
                type: 'player'
            }))
        ]
        setUsers(allUsers)

        // Demo applications
        setApplications([
            { id: 'app1', name: 'Dennis Huseinbasic', email: 'dennis@example.com', type: 'player', position: 'MIDFIELDER', age: 20, status: 'pending', date: '2024-12-26' },
            { id: 'app2', name: 'Sarah Mueller', email: 'sarah@example.com', type: 'staff', department: 'Coaching', status: 'pending', date: '2024-12-27' },
        ])
    }, [])

    const handleApprove = (appId) => {
        setApplications(prev => prev.map(a =>
            a.id === appId ? { ...a, status: 'approved' } : a
        ))
    }

    const handleReject = (appId) => {
        setApplications(prev => prev.map(a =>
            a.id === appId ? { ...a, status: 'rejected' } : a
        ))
    }

    const stats = {
        totalUsers: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        staff: users.filter(u => u.role === 'staff').length,
        players: users.filter(u => u.role === 'player').length,
        pendingApps: applications.filter(a => a.status === 'pending').length
    }

    return (
        <div className="admin-page">
            {/* Stats */}
            <div className="admin-stats">
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{stats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">👑</span>
                    <span className="stat-value">{stats.admins}</span>
                    <span className="stat-label">Admins</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">🏷️</span>
                    <span className="stat-value">{stats.staff}</span>
                    <span className="stat-label">Staff</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">⚽</span>
                    <span className="stat-value">{stats.players}</span>
                    <span className="stat-label">Players</span>
                </div>
                <div className="glass-card-static admin-stat pending">
                    <span className="stat-icon">📋</span>
                    <span className="stat-value">{stats.pendingApps}</span>
                    <span className="stat-label">Pending Apps</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Management
                </button>
                <button
                    className={`admin-tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    📋 Applications
                    {stats.pendingApps > 0 && <span className="tab-badge">{stats.pendingApps}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-card-static admin-section">
                    <div className="section-header">
                        <h3>User Directory</h3>
                    </div>
                    <div className="users-table">
                        <div className="table-header">
                            <span>Name</span>
                            <span>Role</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>
                        {users.map(user => (
                            <div key={user.id} className="table-row">
                                <div className="user-cell">
                                    <div className="avatar avatar-sm">
                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{user.first_name} {user.last_name}</span>
                                        <span className="user-email">{user.email || `${user.first_name?.toLowerCase()}.${user.last_name?.toLowerCase()}@itp.com`}</span>
                                    </div>
                                </div>
                                <span className={`badge badge-${user.role === 'admin' ? 'error' : user.role === 'staff' ? 'info' : 'success'}`}>
                                    {user.role}
                                </span>
                                <span className={`badge status-${user.status || 'active'}`}>
                                    {user.status || 'active'}
                                </span>
                                <div className="action-buttons">
                                    <button className="btn btn-ghost btn-sm">Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
                <div className="glass-card-static admin-section">
                    <div className="section-header">
                        <h3>Pending Applications</h3>
                    </div>
                    <div className="applications-list">
                        {applications.map(app => (
                            <div key={app.id} className={`application-card ${app.status}`}>
                                <div className="app-header">
                                    <div className="app-info">
                                        <h4>{app.name}</h4>
                                        <span className="app-email">{app.email}</span>
                                    </div>
                                    <span className={`badge badge-${app.type === 'player' ? 'success' : 'info'}`}>
                                        {app.type}
                                    </span>
                                </div>
                                <div className="app-details">
                                    {app.type === 'player' ? (
                                        <>
                                            <span>Position: {app.position}</span>
                                            <span>Age: {app.age}</span>
                                        </>
                                    ) : (
                                        <span>Department: {app.department}</span>
                                    )}
                                    <span>Applied: {new Date(app.date).toLocaleDateString()}</span>
                                </div>
                                {app.status === 'pending' && (
                                    <div className="app-actions">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleApprove(app.id)}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleReject(app.id)}
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                )}
                                {app.status !== 'pending' && (
                                    <div className={`app-status-banner ${app.status}`}>
                                        {app.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                    </div>
                                )}
                            </div>
                        ))}
                        {applications.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📋</div>
                                <h3 className="empty-state-title">No applications</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="glass-card-static admin-section">
                    <div className="section-header">
                        <h3>System Settings</h3>
                    </div>
                    <div className="settings-content">
                        <div className="setting-group">
                            <h4>General</h4>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Program Name</span>
                                    <span className="setting-desc">Displayed throughout the application</span>
                                </div>
                                <input className="input setting-input" defaultValue="1.FC Köln ITP" />
                            </div>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Season</span>
                                    <span className="setting-desc">Current program season</span>
                                </div>
                                <input className="input setting-input" defaultValue="2024/25" />
                            </div>
                        </div>
                        <div className="setting-group">
                            <h4>Notifications</h4>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Email Notifications</span>
                                    <span className="setting-desc">Send email alerts for important events</span>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" defaultChecked />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <button className="btn btn-primary mt-4">Save Settings</button>
                    </div>
                </div>
            )}
        </div>
    )
}
