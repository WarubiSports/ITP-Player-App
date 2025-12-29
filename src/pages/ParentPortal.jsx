import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './ParentPortal.css'

export default function ParentPortal() {
    const { profile } = useAuth()
    const [selectedPlayer, setSelectedPlayer] = useState(null)
    const [selectedWeek, setSelectedWeek] = useState('current')

    useEffect(() => {
        // For demo, select first player
        if (demoData.players.length > 0) {
            setSelectedPlayer(demoData.players[0])
        }
    }, [])

    if (!selectedPlayer) {
        return <div className="loading">Loading...</div>
    }

    // Generate weekly report data
    const generateWeeklyReport = () => {
        const playerId = selectedPlayer.id

        // Wellness data (last 7 days)
        const wellnessLogs = demoData.wellnessLogs
            .filter(w => w.player_id === playerId)
            .slice(0, 7)

        const avgWellness = wellnessLogs.length > 0
            ? Math.round(wellnessLogs.reduce((sum, log) => {
                const score = ((log.sleep_quality / 5) * 25) +
                             ((log.energy_level / 10) * 25) +
                             (((10 - log.muscle_soreness) / 10) * 25) +
                             (((10 - log.stress_level) / 10) * 25)
                return sum + score
            }, 0) / wellnessLogs.length)
            : 0

        // Training load (last 7 days)
        const trainingLoads = demoData.trainingLoads
            .filter(t => t.player_id === playerId)
            .slice(0, 7)

        const totalLoad = trainingLoads.reduce((sum, load) => sum + load.load_score, 0)
        const sessionsCompleted = trainingLoads.length

        // Injuries
        const activeInjuries = demoData.injuries.filter(
            i => i.player_id === playerId && i.status !== 'recovered'
        )

        // Academic progress
        const academicProgress = demoData.academicProgress.filter(a => a.player_id === playerId)
        const recentCourses = academicProgress.filter(a => a.status === 'in_progress')
        const avgGPA = calculateGPA(academicProgress.filter(a => a.grade && a.status === 'completed'))

        // College recruitment
        const collegeTargets = demoData.collegeTargets.filter(c => c.player_id === playerId)
        const offers = collegeTargets.filter(c => c.status === 'offer_received')
        const recentScoutActivities = demoData.scoutActivities
            .filter(s => s.player_id === playerId)
            .slice(0, 3)

        // Performance tests
        const performanceTests = demoData.performanceTests.filter(p => p.player_id === playerId)
        const latestTests = performanceTests.slice(0, 3)

        return {
            period: 'Week of Dec 29, 2024 - Jan 5, 2025',
            wellness: {
                avgScore: avgWellness,
                avgSleep: wellnessLogs.length > 0
                    ? (wellnessLogs.reduce((sum, w) => sum + w.sleep_hours, 0) / wellnessLogs.length).toFixed(1)
                    : 0,
                logsCompleted: wellnessLogs.length,
                status: avgWellness >= 80 ? 'excellent' : avgWellness >= 60 ? 'good' : 'needs_attention'
            },
            training: {
                totalLoad,
                sessionsCompleted,
                avgRPE: trainingLoads.length > 0
                    ? (trainingLoads.reduce((sum, t) => sum + t.rpe, 0) / trainingLoads.length).toFixed(1)
                    : 0,
                status: totalLoad > 4000 ? 'high' : totalLoad > 2500 ? 'moderate' : 'low'
            },
            injuries: activeInjuries,
            academic: {
                gpa: avgGPA,
                currentCourses: recentCourses,
                totalCredits: academicProgress.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.credits || 0), 0)
            },
            recruitment: {
                totalTargets: collegeTargets.length,
                offers: offers.length,
                recentActivity: recentScoutActivities
            },
            performance: latestTests
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

    const report = generateWeeklyReport()

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
                        <h2>{selectedPlayer.first_name} {selectedPlayer.last_name}</h2>
                        <p>{selectedPlayer.position} • House: {demoData.houses.find(h => h.id === selectedPlayer.house_id)?.name}</p>
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

                {/* Summary Notes */}
                <div className="glass-card report-section">
                    <h3 className="section-title">📝 Coach's Notes</h3>
                    <div className="coach-notes">
                        <p>
                            {selectedPlayer.first_name} has shown excellent commitment this week.
                            {report.wellness.status === 'excellent'
                                ? ' Wellness metrics are outstanding, showing great recovery and readiness.'
                                : ' Continue monitoring wellness to optimize performance.'}
                        </p>
                        <p>
                            Training load is {report.training.status} this week.
                            {report.training.status === 'high'
                                ? ' We\'re monitoring closely to prevent overtraining.'
                                : ' Progressing well with technical and tactical development.'}
                        </p>
                        {report.recruitment.offers > 0 && (
                            <p>
                                Great news on the recruitment front - {report.recruitment.offers} scholarship offer{report.recruitment.offers > 1 ? 's' : ''} received!
                                We're helping {selectedPlayer.first_name} evaluate options and make the best decision.
                            </p>
                        )}
                    </div>
                </div>
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
