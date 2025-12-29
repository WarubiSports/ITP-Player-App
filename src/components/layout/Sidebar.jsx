import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/players', icon: '⚽', label: 'Players' },
    { path: '/housing', icon: '🏠', label: 'Housing' },
    { path: '/chores', icon: '✅', label: 'Chores' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/messages', icon: '💬', label: 'Messages' },
]

const adminItems = [
    { path: '/admin', icon: '⚙️', label: 'Admin' },
]

export default function Sidebar() {
    const { profile, signOut, isAdmin, isDemoMode } = useAuth()
    const navigate = useNavigate()

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

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/fc-koln-logo.svg" alt="1.FC Köln" />
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
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {isAdmin && (
                    <div className="nav-section">
                        <span className="nav-section-title">Administration</span>
                        {adminItems.map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
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
                    <button className="btn-icon logout-btn" onClick={handleSignOut} title="Sign out">
                        🚪
                    </button>
                </div>
            </div>
        </aside>
    )
}
