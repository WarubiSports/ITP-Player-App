import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Pathway.css'

export default function Pathway() {
    const { profile, isStaff } = useAuth()
    const [recruitmentOpportunities, setRecruitmentOpportunities] = useState([])
    const [academicProgress, setAcademicProgress] = useState([])
    const [performanceTests, setPerformanceTests] = useState([])
    const [filter, setFilter] = useState('all')
    const [showRecruitmentForm, setShowRecruitmentForm] = useState(false)
    const [showAcademicForm, setShowAcademicForm] = useState(false)

    useEffect(() => {
        const playerId = profile?.id || 'p1'
        // Combine college targets and scout activities into unified recruitment opportunities
        const colleges = demoData.collegeTargets?.filter(c => c.player_id === playerId).map(c => ({
            ...c,
            type: 'college',
            name: c.college_name,
            league: c.division ? `${c.division} - ${c.conference}` : c.conference
        })) || []

        // Convert any professional scouts into club opportunities
        const clubs = demoData.scoutActivities?.filter(s =>
            s.player_id === playerId && s.scout_type === 'professional'
        ).map(s => ({
            id: s.id,
            type: 'club',
            name: s.organization,
            location: 'Europe',
            interest_level: s.rating === 'very_positive' ? 'hot' : s.rating === 'positive' ? 'warm' : 'cold',
            status: 'in_contact',
            contact_name: s.scout_name,
            last_contact: s.date,
            notes: s.notes
        })) || []

        setRecruitmentOpportunities([...colleges, ...clubs])
        setAcademicProgress(demoData.academicProgress?.filter(a => a.player_id === playerId) || [])
        setPerformanceTests(demoData.performanceTests?.filter(p => p.player_id === playerId) || [])
    }, [profile])

    const handleRecruitmentSubmit = (e) => {
        e.preventDefault()
        const form = e.target
        const type = form.type.value

        const newOpportunity = {
            id: `ro${Date.now()}`,
            player_id: profile?.id || 'p1',
            type,
            name: form.name.value,
            league: form.league.value,
            location: form.location.value,
            interest_level: form.interestLevel.value,
            status: form.status.value,
            contract_offer: type === 'club' && form.contractOffer?.value ? form.contractOffer.value : null,
            scholarship_amount: type === 'college' && form.scholarshipAmount?.value ? parseInt(form.scholarshipAmount.value) : null,
            contact_name: form.contactName.value || null,
            contact_email: form.contactEmail.value || null,
            last_contact: form.lastContact.value || null,
            notes: form.notes.value
        }
        setRecruitmentOpportunities(prev => [newOpportunity, ...prev])
        setShowRecruitmentForm(false)
    }

    const handleAcademicSubmit = (e) => {
        e.preventDefault()
        const form = e.target
        const newCourse = {
            id: `ap${Date.now()}`,
            player_id: profile?.id || 'p1',
            course_name: form.courseName.value,
            category: form.category.value,
            semester: form.semester.value,
            credits: form.credits.value ? parseFloat(form.credits.value) : null,
            grade: form.grade.value || null,
            status: form.status.value,
            transferable: form.transferable.checked,
            notes: form.notes.value || null
        }
        setAcademicProgress(prev => [newCourse, ...prev])
        setShowAcademicForm(false)
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
            signed: 'success',
            declined: 'secondary'
        }
        return colors[status] || 'secondary'
    }

    const filteredRecruitment = recruitmentOpportunities.filter(opp => {
        if (filter === 'all') return true
        if (filter === 'colleges') return opp.type === 'college'
        if (filter === 'clubs') return opp.type === 'club'
        if (filter === 'offers') return opp.status === 'offer_received' || opp.status === 'signed'
        if (filter === 'hot') return opp.interest_level === 'hot'
        return true
    })

    // Calculate stats
    const collegeCount = recruitmentOpportunities.filter(o => o.type === 'college').length
    const clubCount = recruitmentOpportunities.filter(o => o.type === 'club').length
    const offersCount = recruitmentOpportunities.filter(o => o.status === 'offer_received' || o.status === 'signed').length
    const hotCount = recruitmentOpportunities.filter(o => o.interest_level === 'hot').length

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
                        <span className="overview-value">{recruitmentOpportunities.length}</span>
                        <span className="overview-label">Active Recruitment</span>
                        <span className="overview-detail">
                            {collegeCount} colleges, {clubCount} clubs
                        </span>
                    </div>
                </div>

                <div className="glass-card-static overview-card">
                    <div className="overview-icon">🔥</div>
                    <div className="overview-content">
                        <span className="overview-value">{hotCount}</span>
                        <span className="overview-label">Hot Interest</span>
                        <span className="overview-detail">
                            {offersCount} offers received
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
                <button className="btn btn-primary" onClick={() => setShowRecruitmentForm(true)}>
                    + Add Recruitment Opportunity
                </button>
            </div>

            {/* Active Recruitment Section */}
            <div className="glass-card pathway-section">
                <div className="section-header">
                    <h3 className="section-title">⚽ Active Recruitment</h3>
                    <div className="filter-tabs">
                        {['all', 'colleges', 'clubs', 'offers', 'hot'].map(f => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                {f === 'all' && ` (${recruitmentOpportunities.length})`}
                                {f === 'colleges' && ` (${collegeCount})`}
                                {f === 'clubs' && ` (${clubCount})`}
                                {f === 'offers' && ` (${offersCount})`}
                                {f === 'hot' && ` (${hotCount})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="colleges-grid">
                    {filteredRecruitment.map(opp => (
                        <div key={opp.id} className="college-card glass-card-static">
                            <div className="college-header">
                                <h4 className="college-name">
                                    {opp.type === 'college' ? '🎓 ' : '⚽ '}
                                    {opp.name}
                                </h4>
                                <div className="college-badges">
                                    <span className={`badge badge-${getInterestColor(opp.interest_level)}`}>
                                        {opp.interest_level}
                                    </span>
                                    <span className={`badge badge-${getStatusColor(opp.status)}`}>
                                        {opp.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="college-details">
                                {opp.league && <p><strong>{opp.league}</strong></p>}
                                {opp.location && <p>📍 {opp.location}</p>}
                                {opp.scholarship_amount && (
                                    <p className="scholarship-offer">
                                        💰 {opp.scholarship_amount}% Scholarship
                                    </p>
                                )}
                                {opp.contract_offer && (
                                    <p className="scholarship-offer">
                                        📝 {opp.contract_offer}
                                    </p>
                                )}
                            </div>

                            {opp.contact_name && (
                                <div className="college-contact">
                                    <p><strong>Contact:</strong> {opp.contact_name}</p>
                                    {opp.contact_email && <p>{opp.contact_email}</p>}
                                    {opp.last_contact && (
                                        <p className="last-contact">
                                            Last contact: {new Date(opp.last_contact).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {opp.notes && (
                                <p className="college-notes">{opp.notes}</p>
                            )}
                        </div>
                    ))}
                </div>

                {filteredRecruitment.length === 0 && (
                    <div className="empty-state">
                        <p>No recruitment opportunities yet. Add your first opportunity to start tracking!</p>
                    </div>
                )}
            </div>

            {/* Academic Progress */}
            <div className="glass-card pathway-section">
                <div className="section-header">
                    <h3 className="section-title">📚 Academic Progress</h3>
                    <button className="btn btn-primary" onClick={() => setShowAcademicForm(true)}>
                        + Add Course
                    </button>
                </div>
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

            {/* Recruitment Form Modal */}
            {showRecruitmentForm && (
                <div className="modal-overlay" onClick={() => setShowRecruitmentForm(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Recruitment Opportunity</h3>
                            <button className="modal-close" onClick={() => setShowRecruitmentForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleRecruitmentSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Type</label>
                                    <select name="type" className="input" required>
                                        <option value="college">🎓 College / University</option>
                                        <option value="club">⚽ Professional Club</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Name</label>
                                    <input name="name" className="input" placeholder="College or Club name" required />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">League / Division</label>
                                        <input name="league" className="input" placeholder="e.g., D1 - Big Ten, Bundesliga" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Location</label>
                                        <input name="location" className="input" placeholder="City, Country" required />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Interest Level</label>
                                        <select name="interestLevel" className="input" required>
                                            <option value="cold">Cold - Early Stage</option>
                                            <option value="warm">Warm - In Discussion</option>
                                            <option value="hot">Hot - Strong Interest</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select name="status" className="input" required>
                                            <option value="researching">Researching</option>
                                            <option value="in_contact">In Contact</option>
                                            <option value="offer_received">Offer Received</option>
                                            <option value="signed">Signed</option>
                                            <option value="declined">Declined</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Scholarship % (College)</label>
                                        <input name="scholarshipAmount" type="number" className="input" min="0" max="100" placeholder="0-100" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Contract Details (Club)</label>
                                        <input name="contractOffer" className="input" placeholder="e.g., 2-year contract" />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Contact Name</label>
                                        <input name="contactName" className="input" placeholder="Coach / Scout name" />
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
                                    <textarea name="notes" className="input textarea" rows="3" placeholder="Meeting notes, next steps, etc."></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRecruitmentForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Opportunity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Academic Course Form Modal */}
            {showAcademicForm && (
                <div className="modal-overlay" onClick={() => setShowAcademicForm(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Academic Course</h3>
                            <button className="modal-close" onClick={() => setShowAcademicForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleAcademicSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Course Name</label>
                                    <input name="courseName" className="input" placeholder="e.g., English Composition" required />
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Category</label>
                                        <select name="category" className="input" required>
                                            <option value="core_academic">Core Academic</option>
                                            <option value="language">Language</option>
                                            <option value="elective">Elective</option>
                                            <option value="physical_education">Physical Education</option>
                                            <option value="life_skills">Life Skills</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Semester</label>
                                        <input name="semester" className="input" placeholder="e.g., Fall 2025" required />
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Credits</label>
                                        <input name="credits" type="number" step="0.5" min="0" className="input" placeholder="e.g., 3" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select name="status" className="input" required>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="planned">Planned</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Grade (if completed)</label>
                                    <select name="grade" className="input">
                                        <option value="">Not yet graded</option>
                                        <option value="A">A</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B">B</option>
                                        <option value="B-">B-</option>
                                        <option value="C+">C+</option>
                                        <option value="C">C</option>
                                        <option value="C-">C-</option>
                                        <option value="D">D</option>
                                        <option value="F">F</option>
                                    </select>
                                </div>

                                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" name="transferable" id="transferable" />
                                    <label htmlFor="transferable">NCAA Transferable</label>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notes</label>
                                    <textarea name="notes" className="input textarea" rows="2" placeholder="Optional notes"></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAcademicForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
