import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Pathway.css'

export default function Pathway() {
    const { profile, isStaff } = useAuth()
    const [collegeTargets, setCollegeTargets] = useState([])
    const [scoutActivities, setScoutActivities] = useState([])
    const [academicProgress, setAcademicProgress] = useState([])
    const [performanceTests, setPerformanceTests] = useState([])
    const [filter, setFilter] = useState('all')
    const [showCollegeForm, setShowCollegeForm] = useState(false)
    const [showScoutForm, setShowScoutForm] = useState(false)

    useEffect(() => {
        const playerId = profile?.id || 'p1'
        setCollegeTargets(demoData.collegeTargets.filter(c => c.player_id === playerId))
        setScoutActivities(demoData.scoutActivities.filter(s => s.player_id === playerId))
        setAcademicProgress(demoData.academicProgress.filter(a => a.player_id === playerId))
        setPerformanceTests(demoData.performanceTests.filter(p => p.player_id === playerId))
    }, [profile])

    const handleCollegeSubmit = (e) => {
        e.preventDefault()
        const form = e.target
        const newTarget = {
            id: `ct${Date.now()}`,
            player_id: profile?.id || 'p1',
            college_name: form.collegeName.value,
            division: form.division.value,
            conference: form.conference.value,
            location: form.location.value,
            interest_level: form.interestLevel.value,
            status: form.status.value,
            scholarship_amount: form.scholarshipAmount.value ? parseInt(form.scholarshipAmount.value) : null,
            notes: form.notes.value,
            contact_name: form.contactName.value || null,
            contact_email: form.contactEmail.value || null,
            last_contact: form.lastContact.value || null
        }
        setCollegeTargets(prev => [newTarget, ...prev])
        setShowCollegeForm(false)
    }

    const handleScoutSubmit = (e) => {
        e.preventDefault()
        const form = e.target
        const newActivity = {
            id: `sa${Date.now()}`,
            player_id: profile?.id || 'p1',
            scout_type: form.scoutType.value,
            organization: form.organization.value,
            scout_name: form.scoutName.value,
            date: form.date.value,
            event: form.event.value,
            notes: form.notes.value,
            rating: form.rating.value
        }
        setScoutActivities(prev => [newActivity, ...prev])
        setShowScoutForm(false)
    }

    const getInterestColor = (level) => {
        const colors = { hot: 'error', warm: 'warning', cold: 'info' }
        return colors[level] || 'secondary'
    }

    const getStatusColor = (status) => {
        const colors = {
            offer_received: 'success',
            in_contact: 'warning',
            researching: 'info',
            declined: 'secondary'
        }
        return colors[status] || 'secondary'
    }

    const filteredColleges = collegeTargets.filter(college => {
        if (filter === 'all') return true
        if (filter === 'offers') return college.status === 'offer_received'
        if (filter === 'hot') return college.interest_level === 'hot'
        return true
    })

    // Calculate academic stats
    const totalCredits = academicProgress
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (c.credits || 0), 0)

    const completedCourses = academicProgress.filter(c => c.status === 'completed').length
    const inProgressCourses = academicProgress.filter(c => c.status === 'in_progress').length

    // Get performance improvements
    const getPerformanceImprovement = (testType) => {
        const tests = performanceTests.filter(t => t.test_type === testType).sort((a, b) =>
            new Date(a.test_date) - new Date(b.test_date)
        )
        if (tests.length < 2) return null
        const first = tests[0].result
        const latest = tests[tests.length - 1].result
        const improvement = ((first - latest) / first * 100).toFixed(1)
        return { first, latest, improvement }
    }

    return (
        <div className="pathway-page">
            {/* Progress Overview */}
            <div className="pathway-header">
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">🎯</div>
                    <div className="overview-content">
                        <span className="overview-value">{collegeTargets.length}</span>
                        <span className="overview-label">College Targets</span>
                        <span className="overview-detail">
                            {collegeTargets.filter(c => c.status === 'offer_received').length} offers
                        </span>
                    </div>
                </div>

                <div className="glass-card-static overview-card">
                    <div className="overview-icon">👀</div>
                    <div className="overview-content">
                        <span className="overview-value">{scoutActivities.length}</span>
                        <span className="overview-label">Scout Visits</span>
                        <span className="overview-detail">
                            {scoutActivities.filter(s => s.rating === 'very_positive').length} very positive
                        </span>
                    </div>
                </div>

                <div className="glass-card-static overview-card">
                    <div className="overview-icon">📚</div>
                    <div className="overview-content">
                        <span className="overview-value">{totalCredits.toFixed(1)}</span>
                        <span className="overview-label">NCAA Credits</span>
                        <span className="overview-detail">
                            {completedCourses} completed, {inProgressCourses} in progress
                        </span>
                    </div>
                </div>

                <div className="glass-card-static overview-card">
                    <div className="overview-icon">⚡</div>
                    <div className="overview-content">
                        <span className="overview-value">
                            {performanceTests.length > 0 ? performanceTests[0].percentile : '--'}
                        </span>
                        <span className="overview-label">Avg Percentile</span>
                        <span className="overview-detail">Athletic Testing</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button className="btn btn-primary" onClick={() => setShowCollegeForm(true)}>
                    + Add College Target
                </button>
                {isStaff && (
                    <button className="btn btn-secondary" onClick={() => setShowScoutForm(true)}>
                        + Log Scout Activity
                    </button>
                )}
            </div>

            {/* College Recruitment Section */}
            <div className="glass-card pathway-section">
                <div className="section-header">
                    <h3 className="section-title">🎓 College Recruitment Pipeline</h3>
                    <div className="filter-tabs">
                        {['all', 'offers', 'hot'].map(f => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {f === 'all' && ` (${collegeTargets.length})`}
                                {f === 'offers' && ` (${collegeTargets.filter(c => c.status === 'offer_received').length})`}
                                {f === 'hot' && ` (${collegeTargets.filter(c => c.interest_level === 'hot').length})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="colleges-grid">
                    {filteredColleges.map(college => (
                        <div key={college.id} className="college-card glass-card-static">
                            <div className="college-header">
                                <h4 className="college-name">{college.college_name}</h4>
                                <div className="college-badges">
                                    <span className={`badge badge-${getInterestColor(college.interest_level)}`}>
                                        {college.interest_level}
                                    </span>
                                    <span className={`badge badge-${getStatusColor(college.status)}`}>
                                        {college.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="college-details">
                                <p><strong>{college.division}</strong> • {college.conference}</p>
                                <p>📍 {college.location}</p>
                                {college.scholarship_amount && (
                                    <p className="scholarship-offer">
                                        💰 {college.scholarship_amount}% Scholarship
                                    </p>
                                )}
                            </div>

                            {college.contact_name && (
                                <div className="college-contact">
                                    <p><strong>Contact:</strong> {college.contact_name}</p>
                                    {college.contact_email && <p>{college.contact_email}</p>}
                                    {college.last_contact && (
                                        <p className="last-contact">
                                            Last contact: {new Date(college.last_contact).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {college.notes && (
                                <p className="college-notes">{college.notes}</p>
                            )}
                        </div>
                    ))}
                </div>

                {filteredColleges.length === 0 && (
                    <div className="empty-state">
                        <p>No college targets yet. Add your first target to start tracking!</p>
                    </div>
                )}
            </div>

            {/* Scout Activities Timeline */}
            <div className="glass-card pathway-section">
                <h3 className="section-title">👀 Scout & Agent Activity Log</h3>
                <div className="timeline">
                    {scoutActivities.map(activity => (
                        <div key={activity.id} className="timeline-item">
                            <div className="timeline-marker">
                                <span className="timeline-icon">
                                    {activity.scout_type === 'college' ? '🎓' :
                                     activity.scout_type === 'agent' ? '🤝' : '⚽'}
                                </span>
                            </div>
                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <h4>{activity.organization}</h4>
                                    <span className="timeline-date">
                                        {new Date(activity.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="timeline-scout">{activity.scout_name} • {activity.event}</p>
                                <p className="timeline-notes">{activity.notes}</p>
                                <span className={`badge badge-${
                                    activity.rating === 'very_positive' ? 'success' :
                                    activity.rating === 'positive' ? 'warning' : 'secondary'
                                }`}>
                                    {activity.rating.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {scoutActivities.length === 0 && (
                    <div className="empty-state">
                        <p>No scout activities logged yet.</p>
                    </div>
                )}
            </div>

            {/* Academic Progress */}
            <div className="glass-card pathway-section">
                <h3 className="section-title">📚 Academic Progress</h3>
                <div className="courses-list">
                    {academicProgress.map(course => (
                        <div key={course.id} className="course-item">
                            <div className="course-header">
                                <h4>{course.course_name}</h4>
                                <div className="course-badges">
                                    {course.grade && <span className="grade-badge">{course.grade}</span>}
                                    <span className={`badge badge-${course.status === 'completed' ? 'success' : 'warning'}`}>
                                        {course.status}
                                    </span>
                                </div>
                            </div>
                            <div className="course-details">
                                <span>{course.category.replace('_', ' ')} • {course.semester}</span>
                                {course.credits && <span>{course.credits} credits</span>}
                                {course.transferable && <span className="transferable">✓ NCAA Transferable</span>}
                            </div>
                            {course.notes && <p className="course-notes">{course.notes}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Trends */}
            {performanceTests.length > 0 && (
                <div className="glass-card pathway-section">
                    <h3 className="section-title">📈 Athletic Performance Trends</h3>
                    <div className="performance-grid">
                        {['sprint_10m', 'sprint_30m', 'vertical_jump'].map(testType => {
                            const improvement = getPerformanceImprovement(testType)
                            if (!improvement) return null

                            return (
                                <div key={testType} className="performance-card">
                                    <h4>{testType.replace('_', ' ').toUpperCase()}</h4>
                                    <div className="performance-values">
                                        <div className="perf-value">
                                            <span className="perf-label">Initial</span>
                                            <span className="perf-number">{improvement.first}</span>
                                        </div>
                                        <div className="perf-arrow">→</div>
                                        <div className="perf-value">
                                            <span className="perf-label">Current</span>
                                            <span className="perf-number">{improvement.latest}</span>
                                        </div>
                                    </div>
                                    <div className={`perf-improvement ${parseFloat(improvement.improvement) > 0 ? 'positive' : 'negative'}`}>
                                        {parseFloat(improvement.improvement) > 0 ? '↑' : '↓'} {Math.abs(improvement.improvement)}% improvement
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* College Form Modal */}
            {showCollegeForm && (
                <div className="modal-overlay" onClick={() => setShowCollegeForm(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add College Target</h3>
                            <button className="modal-close" onClick={() => setShowCollegeForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleCollegeSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">College Name</label>
                                    <input name="collegeName" className="input" required />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Division</label>
                                        <select name="division" className="input" required>
                                            <option value="D1">Division 1</option>
                                            <option value="D2">Division 2</option>
                                            <option value="D3">Division 3</option>
                                            <option value="NJCAA">NJCAA</option>
                                            <option value="NAIA">NAIA</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Conference</label>
                                        <input name="conference" className="input" placeholder="e.g., ACC, Big Ten" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Location</label>
                                    <input name="location" className="input" placeholder="City, State" required />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Interest Level</label>
                                        <select name="interestLevel" className="input" required>
                                            <option value="cold">Cold - Researching</option>
                                            <option value="warm">Warm - In Contact</option>
                                            <option value="hot">Hot - Active Interest</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select name="status" className="input" required>
                                            <option value="researching">Researching</option>
                                            <option value="in_contact">In Contact</option>
                                            <option value="offer_received">Offer Received</option>
                                            <option value="declined">Declined</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Scholarship Amount (%)</label>
                                    <input name="scholarshipAmount" type="number" className="input" min="0" max="100" placeholder="0-100" />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Contact Name</label>
                                        <input name="contactName" className="input" placeholder="Coach name" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Contact Email</label>
                                        <input name="contactEmail" type="email" className="input" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Last Contact Date</label>
                                    <input name="lastContact" type="date" className="input" />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notes</label>
                                    <textarea name="notes" className="input textarea" rows="3"></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCollegeForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Target</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Scout Activity Form Modal */}
            {showScoutForm && (
                <div className="modal-overlay" onClick={() => setShowScoutForm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Log Scout Activity</h3>
                            <button className="modal-close" onClick={() => setShowScoutForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleScoutSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Scout Type</label>
                                    <select name="scoutType" className="input" required>
                                        <option value="college">College Coach</option>
                                        <option value="agent">Agent</option>
                                        <option value="professional">Professional Club</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Organization</label>
                                    <input name="organization" className="input" placeholder="College/Club/Agency name" required />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Scout/Coach Name</label>
                                    <input name="scoutName" className="input" required />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input name="date" type="date" className="input" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Event</label>
                                        <input name="event" className="input" placeholder="Match, Training, etc." required />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Rating</label>
                                    <select name="rating" className="input" required>
                                        <option value="very_positive">Very Positive</option>
                                        <option value="positive">Positive</option>
                                        <option value="neutral">Neutral</option>
                                        <option value="negative">Negative</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notes</label>
                                    <textarea name="notes" className="input textarea" rows="3" required></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowScoutForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Log Activity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
