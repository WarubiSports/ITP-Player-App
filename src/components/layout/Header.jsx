import { useLocation } from 'react-router-dom'

const pageTitles = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back to the ITP' },
    '/players': { title: 'Players', subtitle: 'Manage talent program participants' },
    '/housing': { title: 'Housing', subtitle: 'Widdersdorf houses overview' },
    '/chores': { title: 'Chores', subtitle: 'Task management and assignments' },
    '/calendar': { title: 'Calendar', subtitle: 'Training sessions and events' },
    '/admin': { title: 'Administration', subtitle: 'User and system management' },
}

export default function Header() {
    const location = useLocation()
    const pageInfo = pageTitles[location.pathname] || { title: 'Page', subtitle: '' }

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <header className="app-header">
            <div className="header-left">
                <h1 className="header-title">{pageInfo.title}</h1>
                <p className="header-subtitle">{pageInfo.subtitle}</p>
            </div>
            <div className="header-right">
                <span className="header-date">{today}</span>
            </div>
        </header>
    )
}
