import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
    getPlayers,
    getWellnessLogs,
    getWellnessScore,
    getTrainingLoads,
    getInjuries,
    getAcademicProgress,
    getCollegeTargets,
    getScoutActivities,
    getPerformanceTests
} from '../lib/data-service'
import { getLocalDate } from '../lib/date-utils'
import './ParentPortal.css'

// Calculate week range based on selected week type
const getWeekRange = (weekType) => {
    const today = new Date()
    // Get today in CET
    const cetDateStr = getLocalDate('Europe/Berlin')
    const [year, month, day] = cetDateStr.split('-').map(Number)
    const cetToday = new Date(year, month - 1, day)

    // Get the Monday of the current week
    const dayOfWeek = cetToday.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(cetToday)
    monday.setDate(monday.getDate() - daysToMonday)

    // Adjust based on selected week
    if (weekType === 'last') {
        monday.setDate(monday.getDate() - 7)
    } else if (weekType === '2weeks') {
        monday.setDate(monday.getDate() - 14)
    }

    // Get Sunday of that week
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)

    // Format the dates
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return `Week of ${formatDate(monday)} - ${formatDate(sunday)}`
}

export default function ParentPortal() {
    const { profile } = useAuth()
    const [players, setPlayers] = useState([])
    const [selectedPlayer, setSelectedPlayer] = useState(null)
    const [selectedWeek, setSelectedWeek] = useState('current')
    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState(null)

    useEffect(() => {
        loadPlayers()
    }, [])

    useEffect(() => {
        if (selectedPlayer) {
            loadReportData()
        }
    }, [selectedPlayer, selectedWeek])

    const loadPlayers = async () => {
        try {
            const allPlayers = await getPlayers()
            setPlayers(allPlayers)
            // Auto-select first player
            if (allPlayers.length > 0) {
                setSelectedPlayer(allPlayers[0])
            }
        } catch (error) {
            console.error('Error loading players:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadReportData = async () => {
        if (!selectedPlayer) return

        try {
            setLoading(true)
            const playerId = selectedPlayer.id

            // Load all data in parallel
            const [wellness, wellnessScore, training, injuries, academic, colleges, scouts, performance] = await Promise.all([
                getWellnessLogs(playerId, 7),
                getWellnessScore(playerId),
                getTrainingLoads(playerId, 7),
                getInjuries(playerId),
                getAcademicProgress(playerId),
                getCollegeTargets(playerId),
                getScoutActivities(playerId, 3),
                getPerformanceTests(playerId, 3)
            ])

            setReportData({
                wellness,
                wellnessScore,
                training,
                injuries,
                academic,
                colleges,
                scouts,
                performance
            })
        } catch (error) {
            console.error('Error loading report data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!selectedPlayer) {
        return <div className="loading">Loading...</div>
    }

    // Generate weekly report data from loaded data
    const generateWeeklyReport = () => {
        if (!reportData) return null

        const { wellness, wellnessScore, training, injuries, academic, colleges, scouts, performance } = reportData

        // Calculate wellness metrics
        const avgWellness = wellnessScore?.score || 0
        const avgSleep = wellness.length > 0
            ? (wellness.reduce((sum, w) => sum + w.sleep_hours, 0) / wellness.length).toFixed(1)
            : 0

        // Calculate training metrics
        const totalLoad = training.reduce((sum, load) => sum + (load.load_score || 0), 0)
        const avgRPE = training.length > 0
            ? (training.reduce((sum, t) => sum + t.rpe, 0) / training.length).toFixed(1)
            : 0

        // Get active injuries
        const activeInjuries = injuries.filter(i => i.status !== 'cleared')

        // Academic calculations
        const recentCourses = academic.filter(a => a.status === 'in_progress')
        const completedCourses = academic.filter(a => a.grade && a.status === 'completed')
        const avgGPA = calculateGPA(completedCourses)
        const totalCredits = academic.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.credits || 0), 0)

        // Recruitment metrics
        const offers = colleges.filter(c => c.status === 'offer_received')

        return {
            period: getWeekRange(selectedWeek),
            wellness: {
                avgScore: avgWellness,
                avgSleep,
                logsCompleted: wellness.length,
                status: avgWellness >= 80 ? 'excellent' : avgWellness >= 60 ? 'good' : 'needs_attention'
            },
            training: {
                totalLoad,
                sessionsCompleted: training.length,
                avgRPE,
                status: totalLoad > 4000 ? 'high' : totalLoad > 2500 ? 'moderate' : 'low'
            },
            injuries: activeInjuries,
            academic: {
                gpa: avgGPA,
                currentCourses: recentCourses,
                totalCredits
            },
            recruitment: {
                totalTargets: colleges.length,
                offers: offers.length,
                recentActivity: scouts
            },
            performance
        }
    }

    const calculateGPA = (courses) => {
        if (courses.length === 0) return '0.0'

        const gradePoints = {
            'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D': 1.0, 'F': 0.0
        }

        const totalPoints = courses.reduce((sum, course) => {
            return sum + (gradePoints[course.grade] || 0) * (course.credits || 1)
        }, 0)

        const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 1), 0)

        return (totalPoints / totalCredits).toFixed(2)
    }

    if (loading) {
        return (
            <div className="parent-portal-page">
                <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Loading player data...</p>
                </div>
            </div>
        )
    }

    const report = generateWeeklyReport()

    if (!report) {
        return (
            <div className="parent-portal-page">
                <div className="error-state" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                    <p>No data available for this period</p>
                </div>
            </div>
        )
    }

    const getStatusColor = (status) => {
        const colors = {
            excellent: 'success',
            good: 'warning',
            needs_attention: 'error',
            high: 'error',
            moderate: 'warning',
            low: 'success'
        }
        return colors[status] || 'secondary'
    }

    return (
        <div className="parent-portal-page">
            {/* Header */}
            <div className="portal-header glass-card-static">
                <div className="player-info">
                    <div className="player-avatar">
                        {selectedPlayer.first_name[0]}{selectedPlayer.last_name[0]}
                    </div>
                    <div>
                        {players.length > 1 && (
                            <select
                                value={selectedPlayer.id}
                                onChange={(e) => setSelectedPlayer(players.find(p => p.id === e.target.value))}
                                className="input"
                                style={{ marginBottom: '0.5rem', maxWidth: '300px' }}
                            >
                                {players.map(player => (
                                    <option key={player.id} value={player.id}>
                                        {player.first_name} {player.last_name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {players.length === 1 && (
                            <h2>{selectedPlayer.first_name} {selectedPlayer.last_name}</h2>
                        )}
                        <p>{selectedPlayer.position} • {selectedPlayer.nationality}</p>
                    </div>
                </div>
                <div className="week-selector">
                    <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="input"
                    >
                        <option value="current">Current Week</option>
                        <option value="last">Last Week</option>
                        <option value="2weeks">2 Weeks Ago</option>
                    </select>
                    <button className="btn btn-primary">
                        📧 Email Report
                    </button>
                </div>
            </div>

            {/* Report Period */}
            <div className="report-period">
                <h3>Weekly Progress Report</h3>
                <p>{report.period}</p>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="glass-card-static metric-card">
                    <div className="metric-header">
                        <span className="metric-icon">💪</span>
                        <h4>Wellness</h4>
                    </div>
                    <div className="metric-value">
                        <span className={`value ${getStatusColor(report.wellness.status)}`}>
                            {report.wellness.avgScore}
                        </span>
                        <span className="metric-label">Avg Score</span>
                    </div>
                    <div className="metric-details">
                        <div className="detail-row">
                            <span>Average Sleep</span>
                            <span className="detail-value">{report.wellness.avgSleep}h</span>
                        </div>
                        <div className="detail-row">
                            <span>Check-ins Completed</span>
                            <span className="detail-value">{report.wellness.logsCompleted}/7</span>
                        </div>
                    </div>
                    <div className={`status-badge status-${getStatusColor(report.wellness.status)}`}>
                        {report.wellness.status.replace('_', ' ')}
                    </div>
                </div>

                <div className="glass-card-static metric-card">
                    <div className="metric-header">
                        <span className="metric-icon">🏋️</span>
                        <h4>Training Load</h4>
                    </div>
                    <div className="metric-value">
                        <span className={`value ${getStatusColor(report.training.status)}`}>
                            {report.training.totalLoad}
                        </span>
                        <span className="metric-label">Total AU</span>
                    </div>
                    <div className="metric-details">
                        <div className="detail-row">
                            <span>Sessions Completed</span>
                            <span className="detail-value">{report.training.sessionsCompleted}</span>
                        </div>
                        <div className="detail-row">
                            <span>Average Intensity</span>
                            <span className="detail-value">{report.training.avgRPE}/10</span>
                        </div>
                    </div>
                    <div className={`status-badge status-${getStatusColor(report.training.status)}`}>
                        {report.training.status} load
                    </div>
                </div>

                <div className="glass-card-static metric-card">
                    <div className="metric-header">
                        <span className="metric-icon">📚</span>
                        <h4>Academic</h4>
                    </div>
                    <div className="metric-value">
                        <span className="value success">{report.academic.gpa}</span>
                        <span className="metric-label">GPA</span>
                    </div>
                    <div className="metric-details">
                        <div className="detail-row">
                            <span>Current Courses</span>
                            <span className="detail-value">{report.academic.currentCourses.length}</span>
                        </div>
                        <div className="detail-row">
                            <span>Credits Earned</span>
                            <span className="detail-value">{report.academic.totalCredits}</span>
                        </div>
                    </div>
                    <div className="status-badge status-success">
                        on track
                    </div>
                </div>

                <div className="glass-card-static metric-card">
                    <div className="metric-header">
                        <span className="metric-icon">🎯</span>
                        <h4>Recruitment</h4>
                    </div>
                    <div className="metric-value">
                        <span className="value success">{report.recruitment.offers}</span>
                        <span className="metric-label">Offers</span>
                    </div>
                    <div className="metric-details">
                        <div className="detail-row">
                            <span>Target Schools</span>
                            <span className="detail-value">{report.recruitment.totalTargets}</span>
                        </div>
                        <div className="detail-row">
                            <span>Scout Visits</span>
                            <span className="detail-value">{report.recruitment.recentActivity.length}</span>
                        </div>
                    </div>
                    <div className="status-badge status-success">
                        active pipeline
                    </div>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="report-sections">
                {/* Injury Status */}
                {report.injuries.length > 0 && (
                    <div className="glass-card report-section injury-section">
                        <h3 className="section-title">⚠️ Injury Status</h3>
                        {report.injuries.map(injury => (
                            <div key={injury.id} className="injury-report-item">
                                <div className="injury-report-header">
                                    <h4>{injury.injury_type}</h4>
                                    <span className={`badge badge-${injury.severity === 'minor' ? 'warning' : 'error'}`}>
                                        {injury.severity}
                                    </span>
                                </div>
                                <div className="injury-report-details">
                                    <p><strong>Expected Return:</strong> {new Date(injury.expected_return).toLocaleDateString()}</p>
                                    <p><strong>Treatment:</strong> {injury.treatment_plan}</p>
                                    <p>{injury.notes}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Academic Progress */}
                <div className="glass-card report-section">
                    <h3 className="section-title">📖 Academic Progress</h3>
                    <div className="courses-summary">
                        {report.academic.currentCourses.map(course => (
                            <div key={course.id} className="course-summary-item">
                                <div className="course-summary-header">
                                    <span className="course-name">{course.course_name}</span>
                                    {course.grade && <span className="grade-display">{course.grade}</span>}
                                </div>
                                <div className="course-summary-meta">
                                    <span>{course.category.replace('_', ' ')}</span>
                                    {course.credits && <span>{course.credits} credits</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Scout Activity */}
                {report.recruitment.recentActivity.length > 0 && (
                    <div className="glass-card report-section">
                        <h3 className="section-title">👀 Recent Scout Activity</h3>
                        <div className="scout-summary">
                            {report.recruitment.recentActivity.map(activity => (
                                <div key={activity.id} className="scout-summary-item">
                                    <div className="scout-summary-header">
                                        <span className="scout-org">{activity.organization}</span>
                                        <span className="scout-date">{new Date(activity.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="scout-details">{activity.scout_name} • {activity.event}</p>
                                    <p className="scout-notes">{activity.notes}</p>
                                    <span className={`badge badge-${activity.rating === 'very_positive' ? 'success' : 'warning'}`}>
                                        {activity.rating.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Performance Tests */}
                {report.performance.length > 0 && (
                    <div className="glass-card report-section">
                        <h3 className="section-title">📊 Latest Performance Tests</h3>
                        <div className="performance-summary">
                            {report.performance.map(test => (
                                <div key={test.id} className="performance-summary-item">
                                    <div className="perf-test-name">{test.test_type.replace('_', ' ').toUpperCase()}</div>
                                    <div className="perf-test-result">{test.result} {test.unit}</div>
                                    <div className="perf-test-percentile">
                                        <div className="percentile-bar">
                                            <div
                                                className="percentile-fill"
                                                style={{width: `${test.percentile}%`}}
                                            ></div>
                                        </div>
                                        <span>{test.percentile}th percentile</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="report-footer glass-card-static">
                <p>
                    Questions about this report? Contact your player's coaching staff at <a href="mailto:coaches@fckoeln-itp.com">coaches@fckoeln-itp.com</a>
                </p>
                <p className="report-generated">
                    Report generated on {new Date().toLocaleDateString()} •
                    <a href="#" onClick={(e) => { e.preventDefault(); window.print(); }}> Print Report</a>
                </p>
            </div>
        </div>
    )
}
