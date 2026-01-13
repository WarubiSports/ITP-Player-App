import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import {
    LayoutDashboard,
    Heart,
    TrendingUp,
    GraduationCap,
    Home,
    ShoppingCart,
    Calendar,
    Users,
    FileText,
    Settings,
    Menu,
    X,
    LogOut
} from 'lucide-react'

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/wellness', icon: Heart, label: 'Wellness' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/pathway', icon: GraduationCap, label: 'Pathway' },
    { path: '/housing', icon: Home, label: 'House & Tasks' },
    { path: '/grocery', icon: ShoppingCart, label: 'Grocery' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/parent-portal', icon: Users, label: 'Parent Portal' },
]

const staffItems = [
    { path: '/reports', icon: FileText, label: 'Player Reports' },
]

const adminItems = [
    { path: '/admin', icon: Settings, label: 'Admin' },
]

export default function Sidebar() {
    const { profile, signOut, isAdmin, isStaff, isDemoMode } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)

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
                <span className="menu-icon">{isOpen ? <X size={20} /> : <Menu size={20} />}</span>
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
                            <span className="nav-icon"><item.icon size={18} /></span>
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
                                <span className="nav-icon"><item.icon size={18} /></span>
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
                                <span className="nav-icon"><item.icon size={18} /></span>
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
                    {profile?.photo_url ? (
                        <img
                            src={profile.photo_url}
                            alt={displayName}
                            className="avatar avatar-img"
                        />
                    ) : (
                        <div className="avatar">
                            {getInitials(displayName)}
                        </div>
                    )}
                    <div className="user-info">
                        <span className="user-name">{displayName}</span>
                        <span className="user-role">{profile?.role || 'User'}</span>
                    </div>
                    <button className="btn-icon logout-btn" onClick={handleSignOut} title="Sign out">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
        </>
    )
}
