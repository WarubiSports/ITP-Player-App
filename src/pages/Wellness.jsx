import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { getWellnessLogs, getTrainingLoads, getInjuries, createWellnessLog, createTrainingLoad } from '../lib/data-service'
import { getLocalDate, formatDateForDisplay } from '../lib/date-utils'
import Confetti from '../components/celebrations/Confetti'
import StaffWellnessMonitor from '../components/dashboard/StaffWellnessMonitor'
import './Wellness.css'

// Milestone days for streak celebrations
const STREAK_MILESTONES = [7, 14, 30, 60, 100]

// Parse date string as local date (not UTC)
const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date()
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export default function Wellness() {
    const { profile, isStaff } = useAuth()
    const { showNotification } = useNotification()
    const [wellnessLogs, setWellnessLogs] = useState([])
    const [trainingLoads, setTrainingLoads] = useState([])
    const [injuries, setInjuries] = useState([])
    const [showWellnessForm, setShowWellnessForm] = useState(false)
    const [showTrainingForm, setShowTrainingForm] = useState(false)
    const [selectedDate, setSelectedDate] = useState(getLocalDate())
    const [loading, setLoading] = useState(true)
    const [showConfetti, setShowConfetti] = useState(false)
    const [prefillValues, setPrefillValues] = useState(null)

    useEffect(() => {
        loadData()
    }, [profile])

    const loadData = async () => {
        const playerId = profile?.player_id || profile?.id || 'p1'
        try {
            const [wellness, training, injury] = await Promise.all([
                getWellnessLogs(playerId),
                getTrainingLoads(playerId),
                getInjuries(playerId, true)
            ])
            setWellnessLogs(wellness)
            setTrainingLoads(training)
            setInjuries(injury)
        } catch (error) {
            console.error('Error loading wellness data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Get yesterday's wellness log for pre-filling the form
    const getYesterdayLog = () => {
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
        return wellnessLogs.find(log => log.date === yesterdayStr)
    }

    // Open wellness form with pre-filled values from yesterday
    const openWellnessForm = () => {
        setSelectedDate(getLocalDate())
        const yesterdayLog = getYesterdayLog()
        if (yesterdayLog) {
            setPrefillValues({
                sleepHours: yesterdayLog.sleep_hours,
                sleepQuality: yesterdayLog.sleep_quality,
                energyLevel: yesterdayLog.energy_level,
                muscleSoreness: yesterdayLog.muscle_soreness,
                stressLevel: yesterdayLog.stress_level,
                mood: yesterdayLog.mood
            })
        } else {
            setPrefillValues(null)
        }
        setShowWellnessForm(true)
    }

    // Calculate consecutive days streak from logs
    const calculateStreak = (logs) => {
        if (!logs || logs.length === 0) return 0

        const sortedDates = [...new Set(logs.map(l => l.date))].sort().reverse()
        const today = getLocalDate()
        // Calculate yesterday using the same timezone-aware approach
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })

        // Check if most recent log is today or yesterday
        if (sortedDates[0] !== today && sortedDates[0] !== yesterdayStr) {
            return sortedDates[0] === today ? 1 : 0
        }

        let streak = 1
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = parseLocalDate(sortedDates[i])
            const next = parseLocalDate(sortedDates[i + 1])
            const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
                streak++
            } else {
                break
            }
        }
        return streak
    }

    const handleWellnessSubmit = async (e) => {
        e.preventDefault()
        const form = e.target
        const newLog = {
            player_id: profile?.player_id || profile?.id || 'p1',
            date: selectedDate,
            sleep_hours: parseFloat(form.sleepHours.value),
            sleep_quality: parseInt(form.sleepQuality.value),
            energy_level: parseInt(form.energyLevel.value),
            muscle_soreness: parseInt(form.muscleSoreness.value),
            stress_level: parseInt(form.stressLevel.value),
            mood: form.mood.value,
            notes: form.notes.value
        }
        try {
            const savedLog = await createWellnessLog(newLog)
            const updatedLogs = [savedLog, ...wellnessLogs]
            setWellnessLogs(updatedLogs)
            setShowWellnessForm(false)

            // Check for streak milestone
            const newStreak = calculateStreak(updatedLogs)
            if (STREAK_MILESTONES.includes(newStreak)) {
                setShowConfetti(true)
                showNotification(`🔥 ${newStreak}-Day Streak! Amazing consistency!`, 'success')
            } else {
                showNotification('Wellness log saved!', 'success')
            }
        } catch (error) {
            console.error('Error saving wellness log:', error)
            showNotification('Failed to save wellness log', 'error')
        }
    }

    const handleTrainingSubmit = async (e) => {
        e.preventDefault()
        const form = e.target
        const duration = parseInt(form.duration.value)
        const rpe = parseInt(form.rpe.value)
        const newLoad = {
            player_id: profile?.player_id || profile?.id || 'p1',
            date: selectedDate,
            session_type: form.sessionType.value,
            duration,
            rpe,
            notes: form.notes.value
        }
        try {
            const savedLoad = await createTrainingLoad(newLoad)
            setTrainingLoads(prev => [savedLoad, ...prev])
            setShowTrainingForm(false)
            showNotification('Training session saved!', 'success')
        } catch (error) {
            console.error('Error saving training load:', error)
            showNotification('Failed to save training load', 'error')
        }
    }

    // Calculate wellness score (0-100)
    const getWellnessScore = (log) => {
        const sleepScore = (log.sleep_quality / 5) * 25
        const energyScore = (log.energy_level / 10) * 25
        const sorenessScore = ((10 - log.muscle_soreness) / 10) * 25
        const stressScore = ((10 - log.stress_level) / 10) * 25
        return Math.round(sleepScore + energyScore + sorenessScore + stressScore)
    }

    // Calculate 7-day training load
    const calculateWeeklyLoad = () => {
        const last7Days = trainingLoads.slice(0, 7)
        return last7Days.reduce((sum, load) => sum + load.load_score, 0)
    }

    // Get readiness status
    const getReadinessStatus = () => {
        const latestLog = wellnessLogs[0]
        if (!latestLog) return { status: 'unknown', color: 'gray', message: 'No data' }

        const score = getWellnessScore(latestLog)
        if (score >= 80) return { status: 'ready', color: 'success', message: 'Ready to Train' }
        if (score >= 60) return { status: 'moderate', color: 'warning', message: 'Monitor Closely' }
        return { status: 'fatigued', color: 'error', message: 'Consider Rest' }
    }

    const latestWellness = wellnessLogs[0]
    const weeklyLoad = calculateWeeklyLoad()
    const readiness = getReadinessStatus()

    return (
        <div className="wellness-page">
            {/* Milestone Celebration */}
            <Confetti
                active={showConfetti}
                onComplete={() => setShowConfetti(false)}
            />

            {/* Header Stats */}
            <div className="wellness-header">
                <div className="glass-card-static stat-card">
                    <div className="stat-icon-text">WS</div>
                    <div className="stat-content">
                        <span className={`stat-value ${readiness.color}`}>
                            {latestWellness ? getWellnessScore(latestWellness) : '--'}
                        </span>
                        <span className="stat-label">Wellness Score</span>
                        <span className={`stat-status status-${readiness.color}`}>{readiness.message}</span>
                    </div>
                </div>

                <div className="glass-card-static stat-card">
                    <div className="stat-icon-text">TL</div>
                    <div className="stat-content">
                        <span className="stat-value">{weeklyLoad}</span>
                        <span className="stat-label">7-Day Load</span>
                        <span className="stat-status">Training Load Score</span>
                    </div>
                </div>

                <div className="glass-card-static stat-card">
                    <div className="stat-icon-text">SLP</div>
                    <div className="stat-content">
                        <span className="stat-value">{latestWellness?.sleep_hours || '--'}h</span>
                        <span className="stat-label">Last Night Sleep</span>
                        <span className="stat-status">
                            Quality: {latestWellness?.sleep_quality || '--'}/5
                        </span>
                    </div>
                </div>

                <div className="glass-card-static stat-card">
                    <div className="stat-icon-text">NRG</div>
                    <div className="stat-content">
                        <span className="stat-value">{latestWellness?.energy_level || '--'}/10</span>
                        <span className="stat-label">Energy Level</span>
                        <span className="stat-status">Today's Readiness</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="btn btn-primary" onClick={openWellnessForm}>
                    + Log Wellness Check-in
                </button>
                <button className="btn btn-secondary" onClick={() => { setSelectedDate(getLocalDate()); setShowTrainingForm(true); }}>
                    + Log Training Session
                </button>
            </div>

            {/* Staff Wellness Monitor - Live feed of all player check-ins */}
            {isStaff && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                    <h2 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xl)' }}>
                        Team Wellness Monitor
                    </h2>
                    <StaffWellnessMonitor maxItems={15} />
                </div>
            )}

            {/* Active Injuries */}
            {injuries.filter(i => i.status !== 'recovered').length > 0 && (
                <div className="glass-card injury-alert">
                    <h3 className="section-title">Active Injuries</h3>
                    {injuries.filter(i => i.status !== 'recovered').map(injury => (
                        <div key={injury.id} className="injury-item">
                            <div className="injury-header">
                                <h4>{injury.injury_type}</h4>
                                <span className={`badge badge-${injury.severity === 'minor' ? 'warning' : 'error'}`}>
                                    {injury.severity}
                                </span>
                            </div>
                            <div className="injury-details">
                                <p><strong>Occurred:</strong> {parseLocalDate(injury.date_occurred).toLocaleDateString()}</p>
                                <p><strong>Expected Return:</strong> {parseLocalDate(injury.expected_return).toLocaleDateString()}</p>
                                <p><strong>Treatment:</strong> {injury.treatment_plan}</p>
                                {injury.notes && <p className="injury-notes">{injury.notes}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Logs */}
            <div className="logs-container">
                {/* Wellness Logs */}
                <div className="glass-card logs-section">
                    <h3 className="section-title">Recent Wellness Logs</h3>
                    <div className="logs-list">
                        {wellnessLogs.slice(0, 7).map(log => (
                            <div key={log.id} className="log-item">
                                <div className="log-date">
                                    <span className="date-day">{parseLocalDate(log.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="date-num">{parseLocalDate(log.date).getDate()}</span>
                                </div>
                                <div className="log-content">
                                    <div className="log-score">
                                        <span className={`score-badge score-${getWellnessScore(log) >= 80 ? 'good' : getWellnessScore(log) >= 60 ? 'moderate' : 'poor'}`}>
                                            {getWellnessScore(log)}
                                        </span>
                                    </div>
                                    <div className="log-metrics">
                                        <span title="Sleep">SLP {log.sleep_hours}h (Q:{log.sleep_quality}/5)</span>
                                        <span title="Energy">NRG {log.energy_level}/10</span>
                                        <span title="Soreness">SOR {log.muscle_soreness}/10</span>
                                        <span title="Stress">STR {log.stress_level}/10</span>
                                    </div>
                                    <div className="log-mood">Mood: <span className="mood-badge">{log.mood}</span></div>
                                    {log.notes && <p className="log-notes">{log.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Training Load Logs */}
                <div className="glass-card logs-section">
                    <h3 className="section-title">Recent Training Sessions</h3>
                    <div className="logs-list">
                        {trainingLoads.slice(0, 7).map(load => (
                            <div key={load.id} className="log-item">
                                <div className="log-date">
                                    <span className="date-day">{parseLocalDate(load.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="date-num">{parseLocalDate(load.date).getDate()}</span>
                                </div>
                                <div className="log-content">
                                    <div className="training-header">
                                        <span className="session-type">{load.session_type}</span>
                                        <span className="load-score">{load.load_score} AU</span>
                                    </div>
                                    <div className="training-metrics">
                                        <span>Duration: {load.duration} min</span>
                                        <span>RPE: {load.rpe}/10</span>
                                    </div>
                                    {load.notes && <p className="log-notes">{load.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Wellness Form Modal */}
            {showWellnessForm && (
                <div className="modal-overlay" onClick={() => setShowWellnessForm(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Daily Wellness Check-in</h3>
                            <button className="modal-close" onClick={() => setShowWellnessForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleWellnessSubmit}>
                            <div className="modal-body">
                                {prefillValues && (
                                    <div className="prefill-indicator">
                                        <span className="prefill-badge">Yesterday's values pre-filled</span>
                                        <span className="prefill-hint">Adjust as needed for today</span>
                                    </div>
                                )}
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        max={getLocalDate()}
                                    />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Sleep Hours</label>
                                        <input name="sleepHours" type="number" className="input" min="0" max="12" step="0.5" defaultValue={prefillValues?.sleepHours ?? 8} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Sleep Quality (1-5)</label>
                                        <input name="sleepQuality" type="number" className="input" min="1" max="5" defaultValue={prefillValues?.sleepQuality ?? 4} required />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Energy Level (1-10)</label>
                                        <input name="energyLevel" type="number" className="input" min="1" max="10" defaultValue={prefillValues?.energyLevel ?? 7} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Muscle Soreness (1-10)</label>
                                        <input name="muscleSoreness" type="number" className="input" min="1" max="10" defaultValue={prefillValues?.muscleSoreness ?? 3} required />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Stress Level (1-10)</label>
                                        <input name="stressLevel" type="number" className="input" min="1" max="10" defaultValue={prefillValues?.stressLevel ?? 3} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Mood</label>
                                        <select name="mood" className="input" defaultValue={prefillValues?.mood ?? 'good'} required>
                                            <option value="excellent">Excellent</option>
                                            <option value="good">Good</option>
                                            <option value="okay">Okay</option>
                                            <option value="tired">Tired</option>
                                            <option value="poor">Poor</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notes (Optional)</label>
                                    <textarea name="notes" className="input textarea" rows="3" placeholder="Any additional observations..."></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowWellnessForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Wellness Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Training Load Form Modal */}
            {showTrainingForm && (
                <div className="modal-overlay" onClick={() => setShowTrainingForm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Log Training Session</h3>
                            <button className="modal-close" onClick={() => setShowTrainingForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleTrainingSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        max={getLocalDate()}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Session Type</label>
                                    <select name="sessionType" className="input" required>
                                        <option value="training">Team Training</option>
                                        <option value="gym">Gym Session</option>
                                        <option value="match">Match</option>
                                        <option value="recovery">Recovery</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Duration (minutes)</label>
                                        <input name="duration" type="number" className="input" min="1" max="300" defaultValue="90" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">RPE (1-10)</label>
                                        <input name="rpe" type="number" className="input" min="1" max="10" defaultValue="6" required />
                                        <small className="input-hint">Rate of Perceived Exertion</small>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notes (Optional)</label>
                                    <textarea name="notes" className="input textarea" rows="3" placeholder="Session details, focus areas, etc."></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTrainingForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
