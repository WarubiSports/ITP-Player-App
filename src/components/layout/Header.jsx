import { useLocation } from 'react-router-dom'
import { getLocalDate } from '../../lib/date-utils'

const pageTitles = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back to the ITP' },
    '/players': { title: 'Players', subtitle: 'Manage talent program participants' },
    '/wellness': { title: 'Wellness', subtitle: 'Track your health and recovery' },
    '/progress': { title: 'Progress', subtitle: 'Your development journey' },
    '/housing': { title: 'Housing', subtitle: 'Widdersdorf houses overview' },
    '/grocery': { title: 'Grocery', subtitle: 'Order your weekly groceries' },
    '/chores': { title: 'Chores', subtitle: 'Task management and assignments' },
    '/calendar': { title: 'Calendar', subtitle: 'Training sessions and events' },
    '/parent-portal': { title: 'Parent Portal', subtitle: 'Weekly progress reports' },
    '/pathway': { title: 'Pathway', subtitle: 'College recruitment tracker' },
    '/admin': { title: 'Administration', subtitle: 'User and system management' },
}

export default function Header() {
    const location = useLocation()
    const pageInfo = pageTitles[location.pathname] || { title: 'Page', subtitle: '' }

    // Get date in Berlin timezone to match program location
    const berlinDateStr = getLocalDate('Europe/Berlin')
    const [year, month, day] = berlinDateStr.split('-').map(Number)
    const berlinDate = new Date(year, month - 1, day)
    const today = berlinDate.toLocaleDateString('en-US', {
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
