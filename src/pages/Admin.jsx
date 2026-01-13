import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import {
    deletePlayer,
    deleteUser
} from '../lib/data-service'
import { Users, Crown, Briefcase, CircleDot, ClipboardList, Settings, AlertTriangle, Check, X } from 'lucide-react'
import './Admin.css'

export default function Admin() {
    const [users, setUsers] = useState([])
    const [applications, setApplications] = useState([])
    const [activeTab, setActiveTab] = useState('users')
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

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

    const formatDate = (dateStr) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

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

    const openEditModal = (user) => {
        setSelectedUser(user)
        setShowEditModal(true)
    }

    const closeEditModal = () => {
        setShowEditModal(false)
        setSelectedUser(null)
    }

    const openDeleteModal = (user) => {
        setUserToDelete(user)
        setShowDeleteModal(true)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setUserToDelete(null)
    }

    const handleDeleteUser = async (e) => {
        console.log('handleDeleteUser called', { e, userToDelete })

        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!userToDelete) {
            console.error('No user selected for deletion')
            return
        }

        console.log('Deleting user:', userToDelete)
        setDeleteLoading(true)
        try {
            if (userToDelete.type === 'player') {
                await deletePlayer(userToDelete.id)
            } else {
                await deleteUser(userToDelete.id)
            }
            // Remove from local state
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
            closeDeleteModal()
        } catch (error) {
            console.error('Failed to delete user:', error)
            alert('Failed to delete user. Please try again.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleSaveUser = (e) => {
        e.preventDefault()
        const form = e.target

        const updatedUser = {
            ...selectedUser,
            first_name: form.firstName.value,
            last_name: form.lastName.value,
            email: form.email.value,
            role: form.role.value,
            status: form.status.value
        }

        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u))
        closeEditModal()
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
                    <span className="stat-icon"><Users size={20} /></span>
                    <span className="stat-value">{stats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon"><Crown size={20} /></span>
                    <span className="stat-value">{stats.admins}</span>
                    <span className="stat-label">Admins</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon"><Briefcase size={20} /></span>
                    <span className="stat-value">{stats.staff}</span>
                    <span className="stat-label">Staff</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon"><CircleDot size={20} /></span>
                    <span className="stat-value">{stats.players}</span>
                    <span className="stat-label">Players</span>
                </div>
                <div className="glass-card-static admin-stat pending">
                    <span className="stat-icon"><ClipboardList size={20} /></span>
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
                    <Users size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />User Management
                </button>
                <button
                    className={`admin-tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    <ClipboardList size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Applications
                    {stats.pendingApps > 0 && <span className="tab-badge">{stats.pendingApps}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Settings
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
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => openDeleteModal(user)}>Delete</button>
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
                                            <Check size={14} /> Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleReject(app.id)}
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                    </div>
                                )}
                                {app.status !== 'pending' && (
                                    <div className={`app-status-banner ${app.status}`}>
                                        {app.status === 'approved' ? <><Check size={14} /> Approved</> : <><X size={14} /> Rejected</>}
                                    </div>
                                )}
                            </div>
                        ))}
                        {applications.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon"><ClipboardList size={48} /></div>
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

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit User</h3>
                            <button className="modal-close" onClick={closeEditModal}>×</button>
                        </div>
                        <form onSubmit={handleSaveUser}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">First Name</label>
                                        <input
                                            name="firstName"
                                            className="input"
                                            defaultValue={selectedUser.first_name}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Last Name</label>
                                        <input
                                            name="lastName"
                                            className="input"
                                            defaultValue={selectedUser.last_name}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="input"
                                        defaultValue={selectedUser.email || `${selectedUser.first_name?.toLowerCase()}.${selectedUser.last_name?.toLowerCase()}@itp.com`}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Role</label>
                                        <select name="role" className="input" defaultValue={selectedUser.role}>
                                            <option value="player">Player</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select name="status" className="input" defaultValue={selectedUser.status || 'active'}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="injured">Injured</option>
                                            <option value="training">Training</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Delete User</h3>
                            <button className="modal-close" onClick={closeDeleteModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-warning">
                                <span className="delete-warning-icon"><AlertTriangle size={32} /></span>
                                <p>Are you sure you want to delete <strong>{userToDelete.first_name} {userToDelete.last_name}</strong>?</p>
                                <p className="delete-warning-text">
                                    This action cannot be undone. All associated data including wellness logs, goals, achievements, and grocery orders will be permanently deleted.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDeleteUser}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
