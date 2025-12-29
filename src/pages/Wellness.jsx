import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Wellness.css'

export default function Wellness() {
    const { profile } = useAuth()
    const [wellnessLogs, setWellnessLogs] = useState([])
    const [trainingLoads, setTrainingLoads] = useState([])
    const [injuries, setInjuries] = useState([])
    const [showWellnessForm, setShowWellnessForm] = useState(false)
    const [showTrainingForm, setShowTrainingForm] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        // Get current player's data
        const playerId = profile?.id || 'p1'
        setWellnessLogs(demoData.wellnessLogs.filter(w => w.player_id === playerId))
        setTrainingLoads(demoData.trainingLoads.filter(t => t.player_id === playerId))
        setInjuries(demoData.injuries.filter(i => i.player_id === playerId))
    }, [profile])

    const handleWellnessSubmit = (e) => {
        e.preventDefault()
        const form = e.target
        const newLog = {
            id: `w${Date.now()}`,
            player_id: profile?.id || 'p1',
            date: selectedDate,
            sleep_hours: parseFloat(form.sleepHours.value),
            sleep_quality: parseInt(form.sleepQuality.value),
            energy_level: parseInt(form.energyLevel.value),
            muscle_soreness: parseInt(form.muscleSoreness.value),
            stress_level: parseInt(form.stressLevel.value),
            mood: form.mood.value,
            notes: form.notes.value,
            created_at: new Date().toISOString()
        }
        setWellnessLogs(prev => [newLog, ...prev])
        setShowWellnessForm(false)
    }

    const handleTrainingSubmit = (e) => {
        e.preventDefault()
        const form = e.target
        const duration = parseInt(form.duration.value)
        const rpe = parseInt(form.rpe.value)
        const newLoad = {
            id: `tl${Date.now()}`,
            player_id: profile?.id || 'p1',
            date: selectedDate,
            session_type: form.sessionType.value,
            duration,
            rpe,
            load_score: duration * rpe,
            notes: form.notes.value,
            created_at: new Date().toISOString()
        }
        setTrainingLoads(prev => [newLoad, ...prev])
        setShowTrainingForm(false)
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
            {/* Header Stats */}
            <div className="wellness-header">
                <div className="glass-card-static stat-card">
                    <div className="stat-icon">💪</div>
                    <div className="stat-content">
                        <span className={`stat-value ${readiness.color}`}>
                            {latestWellness ? getWellnessScore(latestWellness) : '--'}
                        </span>
                        <span className="stat-label">Wellness Score</span>
                        <span className={`stat-status status-${readiness.color}`}>{readiness.message}</span>
                    </div>
                </div>

                <div className="glass-card-static stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <span className="stat-value">{weeklyLoad}</span>
                        <span className="stat-label">7-Day Load</span>
                        <span className="stat-status">Training Load Score</span>
                    </div>
                </div>

                <div className="glass-card-static stat-card">
                    <div className="stat-icon">😴</div>
                    <div className="stat-content">
                        <span className="stat-value">{latestWellness?.sleep_hours || '--'}h</span>
                        <span className="stat-label">Last Night Sleep</span>
                        <span className="stat-status">
                            Quality: {latestWellness?.sleep_quality || '--'}/5
                        </span>
                    </div>
                </div>

                <div className="glass-card-static stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <span className="stat-value">{latestWellness?.energy_level || '--'}/10</span>
                        <span className="stat-label">Energy Level</span>
                        <span className="stat-status">Today's Readiness</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="btn btn-primary" onClick={() => setShowWellnessForm(true)}>
                    + Log Wellness Check-in
                </button>
                <button className="btn btn-secondary" onClick={() => setShowTrainingForm(true)}>
                    + Log Training Session
                </button>
            </div>

            {/* Active Injuries */}
            {injuries.filter(i => i.status !== 'recovered').length > 0 && (
                <div className="glass-card injury-alert">
                    <h3 className="section-title">🚨 Active Injuries</h3>
                    {injuries.filter(i => i.status !== 'recovered').map(injury => (
                        <div key={injury.id} className="injury-item">
                            <div className="injury-header">
                                <h4>{injury.injury_type}</h4>
                                <span className={`badge badge-${injury.severity === 'minor' ? 'warning' : 'error'}`}>
                                    {injury.severity}
                                </span>
                            </div>
                            <div className="injury-details">
                                <p><strong>Occurred:</strong> {new Date(injury.date_occurred).toLocaleDateString()}</p>
                                <p><strong>Expected Return:</strong> {new Date(injury.expected_return).toLocaleDateString()}</p>
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
                    <h3 className="section-title">📝 Recent Wellness Logs</h3>
                    <div className="logs-list">
                        {wellnessLogs.slice(0, 7).map(log => (
                            <div key={log.id} className="log-item">
                                <div className="log-date">
                                    <span className="date-day">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="date-num">{new Date(log.date).getDate()}</span>
                                </div>
                                <div className="log-content">
                                    <div className="log-score">
                                        <span className={`score-badge score-${getWellnessScore(log) >= 80 ? 'good' : getWellnessScore(log) >= 60 ? 'moderate' : 'poor'}`}>
                                            {getWellnessScore(log)}
                                        </span>
                                    </div>
                                    <div className="log-metrics">
                                        <span title="Sleep">😴 {log.sleep_hours}h (Q:{log.sleep_quality}/5)</span>
                                        <span title="Energy">⚡ {log.energy_level}/10</span>
                                        <span title="Soreness">💪 {log.muscle_soreness}/10</span>
                                        <span title="Stress">😰 {log.stress_level}/10</span>
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
                    <h3 className="section-title">🏋️ Recent Training Sessions</h3>
                    <div className="logs-list">
                        {trainingLoads.slice(0, 7).map(load => (
                            <div key={load.id} className="log-item">
                                <div className="log-date">
                                    <span className="date-day">{new Date(load.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="date-num">{new Date(load.date).getDate()}</span>
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
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Sleep Hours</label>
                                        <input name="sleepHours" type="number" className="input" min="0" max="12" step="0.5" defaultValue="8" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Sleep Quality (1-5)</label>
                                        <input name="sleepQuality" type="number" className="input" min="1" max="5" defaultValue="4" required />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Energy Level (1-10)</label>
                                        <input name="energyLevel" type="number" className="input" min="1" max="10" defaultValue="7" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Muscle Soreness (1-10)</label>
                                        <input name="muscleSoreness" type="number" className="input" min="1" max="10" defaultValue="3" required />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Stress Level (1-10)</label>
                                        <input name="stressLevel" type="number" className="input" min="1" max="10" defaultValue="3" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Mood</label>
                                        <select name="mood" className="input" required>
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
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Session Type</label>
                                    <select name="sessionType" className="input" required>
                                        <option value="training">Training</option>
                                        <option value="match">Match</option>
                                        <option value="gym">Gym</option>
                                        <option value="recovery">Recovery</option>
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
