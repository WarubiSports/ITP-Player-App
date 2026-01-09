import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

// Simple Password Modal
function PasswordModal({ isOpen, onClose, onSave }) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        const result = await onSave(password)
        setLoading(false)

        if (result.error) {
            setError(result.error.message)
        } else {
            setSuccess(result.message)
            setPassword('')
            setConfirmPassword('')
            setTimeout(() => onClose(), 1500)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Set Password</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p className="text-sm text-muted mb-4">
                            Create a password so you can sign in without email link
                        </p>

                        {error && <div className="alert alert-error mb-4">{error}</div>}
                        {success && <div className="alert alert-success mb-4">{success}</div>}

                        <div className="input-group mb-3">
                            <label className="input-label">New Password</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                minLength={6}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Confirm Password</label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/players', icon: '⚽', label: 'Players' },
    { path: '/wellness', icon: '💪', label: 'Wellness' },
    { path: '/progress', icon: '📈', label: 'Progress' },
    { path: '/pathway', icon: '🎓', label: 'Pathway' },
    { path: '/housing', icon: '🏠', label: 'House & Tasks' },
    { path: '/grocery', icon: '🛒', label: 'Grocery' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/parent-portal', icon: '👨‍👩‍👧', label: 'Parent Portal' },
]

const staffItems = [
    { path: '/reports', icon: '📄', label: 'Player Reports' },
]

const adminItems = [
    { path: '/admin', icon: '⚙️', label: 'Admin' },
]

export default function Sidebar() {
    const { profile, signOut, updatePassword, isAdmin, isStaff, isDemoMode } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const displayName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`
        : profile?.email?.split('@')[0] || 'User'

    const closeSidebar = () => setIsOpen(false)

    // Close sidebar on route change (mobile)
    useEffect(() => {
        closeSidebar()
    }, [location.pathname])

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <span className="menu-icon">{isOpen ? '✕' : '☰'}</span>
            </button>

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/fc-koln-logo.png" alt="1.FC Köln" />
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-title">1.FC Köln</span>
                        <span className="sidebar-brand-sub">ITP Management</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-section-title">Menu</span>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {isStaff && (
                    <div className="nav-section">
                        <span className="nav-section-title">Staff Tools</span>
                        {staffItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}

                {isAdmin && (
                    <div className="nav-section">
                        <span className="nav-section-title">Administration</span>
                        {adminItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <ThemeToggle />
                {isDemoMode && (
                    <div className="demo-badge-small">Demo Mode</div>
                )}
                <div className="user-card">
                    <div className="avatar">
                        {getInitials(displayName)}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{displayName}</span>
                        <span className="user-role">{profile?.role || 'User'}</span>
                    </div>
                    <div className="user-actions">
                        {!isDemoMode && (
                            <button
                                className="btn-icon"
                                onClick={() => setShowPasswordModal(true)}
                                title="Set password"
                            >
                                🔑
                            </button>
                        )}
                        <button className="btn-icon logout-btn" onClick={handleSignOut} title="Sign out">
                            🚪
                        </button>
                    </div>
                </div>
            </div>

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSave={updatePassword}
            />
        </aside>
        </>
    )
}
