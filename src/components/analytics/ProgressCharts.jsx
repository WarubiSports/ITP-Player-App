import { useState, useEffect } from 'react'
import {
    getWellnessLogs,
    getTrainingLoads,
    getPerformanceTests,
    getAcademicProgress
} from '../../lib/data-service'
import { formatDateForDisplay, getDateDaysAgo, getLocalDate } from '../../lib/date-utils'
import './ProgressCharts.css'

// Helper to parse date string correctly (avoids timezone issues)
const parseDate = (dateStr) => {
    if (!dateStr) return new Date()
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

/**
 * ProgressCharts Component
 * Visualizes player progress over time across multiple dimensions
 * Shows holistic development: wellness, performance, academics
 */
export default function ProgressCharts({ playerId }) {
    const [activeTab, setActiveTab] = useState('history')
    const [wellnessData, setWellnessData] = useState([])
    const [trainingData, setTrainingData] = useState([])
    const [performanceData, setPerformanceData] = useState([])
    const [academicData, setAcademicData] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showArchive, setShowArchive] = useState(false)

    useEffect(() => {
        loadProgressData()
    }, [playerId])

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadProgressData()
        setRefreshing(false)
    }

    const loadProgressData = async () => {
        try {
            setLoading(true)
            const [wellness, training, performance, academic] = await Promise.all([
                getWellnessLogs(playerId, 30),
                getTrainingLoads(playerId, 30),
                getPerformanceTests(playerId),
                getAcademicProgress(playerId)
            ])

            setWellnessData(wellness || [])
            setTrainingData(training || [])
            setPerformanceData(performance || [])
            setAcademicData(academic || [])
        } catch (error) {
            console.error('Error loading progress data:', error)
        } finally {
            setLoading(false)
        }
    }

    const renderWellnessTrend = () => {
        if (wellnessData.length === 0) {
            return <div className="no-data">No wellness data yet. Start logging daily!</div>
        }

        const last7Days = wellnessData.slice(0, 7).reverse()
        const maxEnergy = Math.max(...last7Days.map(d => d.energy_level))

        return (
            <div className="chart-container">
                <h4>7-Day Wellness Trend</h4>
                <div className="bar-chart">
                    {last7Days.map((log, index) => (
                        <div key={log.id} className="bar-group">
                            <div className="bar-label">{parseDate(log.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="bar-stack">
                                <div
                                    className="bar bar-energy"
                                    style={{ height: `${(log.energy_level / 10) * 100}%` }}
                                    title={`Energy: ${log.energy_level}/10`}
                                />
                            </div>
                            <div className="bar-value">{log.energy_level}</div>
                        </div>
                    ))}
                </div>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-icon">😴</div>
                        <div className="metric-label">Avg Sleep</div>
                        <div className="metric-value">
                            {(wellnessData.reduce((sum, d) => sum + d.sleep_hours, 0) / wellnessData.length).toFixed(1)}h
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">⚡</div>
                        <div className="metric-label">Avg Energy</div>
                        <div className="metric-value">
                            {(wellnessData.reduce((sum, d) => sum + d.energy_level, 0) / wellnessData.length).toFixed(1)}/10
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">💪</div>
                        <div className="metric-label">Avg Soreness</div>
                        <div className="metric-value">
                            {(wellnessData.reduce((sum, d) => sum + d.muscle_soreness, 0) / wellnessData.length).toFixed(1)}/10
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">😊</div>
                        <div className="metric-label">Mood</div>
                        <div className="metric-value">
                            {wellnessData[0]?.mood || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderTrainingLoad = () => {
        if (trainingData.length === 0) {
            return <div className="no-data">No training data yet. Start logging sessions!</div>
        }

        const last7Days = trainingData.slice(0, 7).reverse()
        const maxLoad = Math.max(...last7Days.map(d => d.load_score))

        return (
            <div className="chart-container">
                <h4>7-Day Training Load</h4>
                <div className="bar-chart">
                    {last7Days.map((load, index) => (
                        <div key={load.id} className="bar-group">
                            <div className="bar-label">{parseDate(load.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="bar-stack">
                                <div
                                    className="bar bar-training"
                                    style={{ height: `${(load.load_score / maxLoad) * 100}%` }}
                                    title={`Load: ${load.load_score} (${load.duration}min × RPE ${load.rpe})`}
                                />
                            </div>
                            <div className="bar-value">{load.load_score}</div>
                        </div>
                    ))}
                </div>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-icon">🏃</div>
                        <div className="metric-label">Total Sessions</div>
                        <div className="metric-value">{trainingData.length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">⏱️</div>
                        <div className="metric-label">Total Minutes</div>
                        <div className="metric-value">
                            {trainingData.reduce((sum, d) => sum + d.duration, 0)}
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">📊</div>
                        <div className="metric-label">Avg RPE</div>
                        <div className="metric-value">
                            {(trainingData.reduce((sum, d) => sum + d.rpe, 0) / trainingData.length).toFixed(1)}/10
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">💥</div>
                        <div className="metric-label">Total Load</div>
                        <div className="metric-value">
                            {trainingData.reduce((sum, d) => sum + d.load_score, 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderPerformanceTests = () => {
        if (performanceData.length === 0) {
            return <div className="no-data">No performance tests recorded yet.</div>
        }

        // Group by test type and show improvement
        const testsByType = {}
        performanceData.forEach(test => {
            if (!testsByType[test.test_type]) {
                testsByType[test.test_type] = []
            }
            testsByType[test.test_type].push(test)
        })

        return (
            <div className="chart-container">
                <h4>Performance Test Results</h4>
                <div className="performance-tests-grid">
                    {Object.entries(testsByType).map(([type, tests]) => {
                        const latest = tests[0]
                        const previous = tests[1]
                        const improvement = previous
                            ? ((previous.result - latest.result) / previous.result * 100).toFixed(1)
                            : null

                        return (
                            <div key={type} className="test-card">
                                <div className="test-type">{type.replace(/_/g, ' ')}</div>
                                <div className="test-result">
                                    {latest.result} {latest.unit}
                                </div>
                                {latest.percentile && (
                                    <div className="test-percentile">
                                        {latest.percentile}th percentile
                                    </div>
                                )}
                                {improvement && (
                                    <div className={`test-improvement ${improvement > 0 ? 'positive' : 'negative'}`}>
                                        {improvement > 0 ? '↑' : '↓'} {Math.abs(improvement)}% vs last test
                                    </div>
                                )}
                                <div className="test-date">
                                    {parseDate(latest.test_date).toLocaleDateString()}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderAcademicProgress = () => {
        if (academicData.length === 0) {
            return <div className="no-data">No academic data recorded yet.</div>
        }

        const completed = academicData.filter(a => a.status === 'completed')
        const inProgress = academicData.filter(a => a.status === 'in_progress')
        const totalCredits = completed.reduce((sum, a) => sum + (a.credits || 0), 0)

        // Calculate GPA
        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0
        }

        let totalPoints = 0
        let totalGradeCredits = 0

        completed.forEach(course => {
            const points = gradePoints[course.grade]
            if (points !== undefined && course.credits) {
                totalPoints += points * course.credits
                totalGradeCredits += course.credits
            }
        })

        const gpa = totalGradeCredits > 0 ? (totalPoints / totalGradeCredits).toFixed(2) : 'N/A'

        return (
            <div className="chart-container">
                <h4>Academic Progress</h4>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-icon">🎓</div>
                        <div className="metric-label">GPA</div>
                        <div className="metric-value">{gpa}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">📚</div>
                        <div className="metric-label">Credits Earned</div>
                        <div className="metric-value">{totalCredits.toFixed(1)}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">✅</div>
                        <div className="metric-label">Completed</div>
                        <div className="metric-value">{completed.length}</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">📝</div>
                        <div className="metric-label">In Progress</div>
                        <div className="metric-value">{inProgress.length}</div>
                    </div>
                </div>

                <div className="course-list">
                    <h5>Recent Courses</h5>
                    {academicData.slice(0, 5).map(course => (
                        <div key={course.id} className="course-item">
                            <div className="course-name">{course.course_name}</div>
                            <div className="course-details">
                                <span className={`course-status status-${course.status}`}>
                                    {course.status.replace('_', ' ')}
                                </span>
                                {course.grade && <span className="course-grade">{course.grade}</span>}
                                {course.credits && <span className="course-credits">{course.credits} credits</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderLogHistory = () => {
        // Combine wellness and training logs and sort by date
        const allLogs = []

        wellnessData.forEach(log => {
            allLogs.push({
                id: `wellness-${log.id}`,
                type: 'wellness',
                date: log.date,
                data: log
            })
        })

        trainingData.forEach(log => {
            allLogs.push({
                id: `training-${log.id}`,
                type: 'training',
                date: log.date,
                data: log
            })
        })

        // Sort by date descending
        allLogs.sort((a, b) => b.date.localeCompare(a.date))

        if (allLogs.length === 0) {
            return (
                <div className="no-data">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📓</div>
                    <p>No logs yet. Start your daily check-ins to build your diary!</p>
                </div>
            )
        }

        // Separate recent (last 7 days) from archived logs, excluding future dates
        const sevenDaysAgo = getDateDaysAgo(7)
        const today = getLocalDate()
        const recentLogs = allLogs.filter(log => log.date >= sevenDaysAgo && log.date <= today)
        const archivedLogs = allLogs.filter(log => log.date < sevenDaysAgo && log.date <= today)

        // Group logs by date
        const groupByDate = (logs) => {
            const grouped = {}
            logs.forEach(log => {
                if (!grouped[log.date]) {
                    grouped[log.date] = []
                }
                grouped[log.date].push(log)
            })
            return grouped
        }

        const recentByDate = groupByDate(recentLogs)
        const archivedByDate = groupByDate(archivedLogs)

        const getMoodEmoji = (mood) => {
            switch (mood) {
                case 'excellent': return '😄'
                case 'good': return '🙂'
                case 'okay': return '😐'
                case 'tired': return '😴'
                case 'poor': return '😔'
                default: return '🙂'
            }
        }

        const getSorenessLevel = (level) => {
            if (level <= 2) return { text: 'Fresh', color: '#4CAF50' }
            if (level <= 4) return { text: 'Light', color: '#8BC34A' }
            if (level <= 6) return { text: 'Moderate', color: '#FFC107' }
            if (level <= 8) return { text: 'High', color: '#FF9800' }
            return { text: 'Severe', color: '#f44336' }
        }

        const renderLogEntries = (logsByDate) => (
            Object.entries(logsByDate).map(([date, logs]) => (
                <div key={date} className="log-day">
                    <div className="log-date-header">
                        <span className="log-date">
                            {parseDate(date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </span>
                    </div>

                    <div className="log-entries">
                        {logs.map(log => (
                            <div key={log.id} className={`log-entry log-entry-${log.type}`}>
                                {log.type === 'wellness' && (
                                    <>
                                        <div className="log-entry-header">
                                            <span className="log-icon">💚</span>
                                            <span className="log-title">Wellness Check-in</span>
                                            <span className="log-mood">{getMoodEmoji(log.data.mood)}</span>
                                        </div>
                                        <div className="log-entry-body">
                                            <div className="log-stats">
                                                <div className="log-stat">
                                                    <span className="stat-label">Sleep</span>
                                                    <span className="stat-value">{log.data.sleep_hours?.toFixed(1)}h</span>
                                                </div>
                                                <div className="log-stat">
                                                    <span className="stat-label">Energy</span>
                                                    <span className="stat-value">{log.data.energy_level}/10</span>
                                                </div>
                                                <div className="log-stat">
                                                    <span className="stat-label">Soreness</span>
                                                    <span className="stat-value" style={{ color: getSorenessLevel(log.data.muscle_soreness).color }}>
                                                        {getSorenessLevel(log.data.muscle_soreness).text}
                                                    </span>
                                                </div>
                                            </div>
                                            {log.data.notes && (
                                                <div className="log-notes">
                                                    <span className="notes-label">Notes:</span> {log.data.notes}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {log.type === 'training' && (
                                    <>
                                        <div className="log-entry-header">
                                            <span className="log-icon">⚽</span>
                                            <span className="log-title">Training Session</span>
                                            <span className="log-session-type">{log.data.session_type}</span>
                                        </div>
                                        <div className="log-entry-body">
                                            <div className="log-stats">
                                                <div className="log-stat">
                                                    <span className="stat-label">Duration</span>
                                                    <span className="stat-value">{log.data.duration} min</span>
                                                </div>
                                                <div className="log-stat">
                                                    <span className="stat-label">RPE</span>
                                                    <span className="stat-value">{log.data.rpe}/10</span>
                                                </div>
                                                <div className="log-stat">
                                                    <span className="stat-label">Load</span>
                                                    <span className="stat-value stat-highlight">{log.data.load_score}</span>
                                                </div>
                                            </div>
                                            {log.data.notes && (
                                                <div className="log-notes">
                                                    <span className="notes-label">Notes:</span> {log.data.notes}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )

        return (
            <div className="chart-container">
                <h4>Your Training Diary</h4>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    A chronological record of your wellness check-ins and training sessions
                </p>

                {/* Recent Logs (Last 7 Days) */}
                <div className="log-section">
                    <div className="log-section-header">
                        <h5>Recent (Last 7 Days)</h5>
                        <span className="log-count">{recentLogs.length} entries</span>
                    </div>
                    {recentLogs.length > 0 ? (
                        <div className="log-history">
                            {renderLogEntries(recentByDate)}
                        </div>
                    ) : (
                        <div className="no-recent-logs">
                            <p>No logs in the last 7 days. Complete a daily check-in to start tracking!</p>
                        </div>
                    )}
                </div>

                {/* Archived Logs */}
                {archivedLogs.length > 0 && (
                    <div className="log-section archive-section">
                        <button
                            className="archive-toggle"
                            onClick={() => setShowArchive(!showArchive)}
                        >
                            <span className="archive-icon">{showArchive ? '📂' : '📁'}</span>
                            <span>Archive ({archivedLogs.length} entries)</span>
                            <span className="toggle-arrow">{showArchive ? '▲' : '▼'}</span>
                        </button>
                        {showArchive && (
                            <div className="log-history archive-logs">
                                {renderLogEntries(archivedByDate)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="progress-charts">
                <div className="loading-state">Loading progress data...</div>
            </div>
        )
    }

    return (
        <div className="progress-charts">
            <div className="progress-header">
                <div>
                    <h3>📈 Your Progress</h3>
                    <p>Track your holistic development over time</p>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{ minWidth: '100px' }}
                >
                    {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
                </button>
            </div>

            <div className="tab-buttons">
                <button
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📓 Log History
                </button>
                <button
                    className={`tab-button ${activeTab === 'wellness' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wellness')}
                >
                    💚 Wellness
                </button>
                <button
                    className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
                    onClick={() => setActiveTab('training')}
                >
                    ⚽ Training
                </button>
                <button
                    className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    🏃 Performance
                </button>
                <button
                    className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('academic')}
                >
                    🎓 Academic
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'history' && renderLogHistory()}
                {activeTab === 'wellness' && renderWellnessTrend()}
                {activeTab === 'training' && renderTrainingLoad()}
                {activeTab === 'performance' && renderPerformanceTests()}
                {activeTab === 'academic' && renderAcademicProgress()}
            </div>
        </div>
    )
}
