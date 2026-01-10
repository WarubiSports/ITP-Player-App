import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
    getPlayers,
    getPlayerById,
    getBodyComposition,
    getPerformanceTests,
    getPlayerEvaluations,
    getTryoutReports,
    getPlayerMedia,
    getCollegeTargets,
    getAcademicProgress,
    PERFORMANCE_BENCHMARKS,
    getAgeGroup,
    evaluatePerformance
} from '../lib/data-service'
import './PlayerReport.css'

export default function PlayerReport() {
    const { profile, isStaff } = useAuth()
    const [players, setPlayers] = useState([])
    const [selectedPlayerId, setSelectedPlayerId] = useState(null)
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const reportRef = useRef(null)

    useEffect(() => {
        loadPlayers()
    }, [])

    useEffect(() => {
        if (selectedPlayerId) {
            loadReportData(selectedPlayerId)
        }
    }, [selectedPlayerId])

    const loadPlayers = async () => {
        try {
            const allPlayers = await getPlayers()
            setPlayers(allPlayers.filter(p => p.status === 'active'))

            // If user is a player, auto-select their own report
            if (!isStaff && profile?.player_id) {
                setSelectedPlayerId(profile.player_id)
            } else if (allPlayers.length > 0) {
                setSelectedPlayerId(allPlayers[0].id)
            }
        } catch (error) {
            console.error('Error loading players:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadReportData = async (playerId) => {
        try {
            setLoading(true)
            const [
                player,
                bodyComp,
                performance,
                evaluations,
                tryouts,
                media,
                recruitment,
                academic
            ] = await Promise.all([
                getPlayerById(playerId),
                getBodyComposition(playerId),
                getPerformanceTests(playerId),
                getPlayerEvaluations(playerId),
                getTryoutReports(playerId),
                getPlayerMedia(playerId),
                getCollegeTargets(playerId),
                getAcademicProgress(playerId)
            ])

            setReportData({
                player,
                bodyComp,
                performance,
                evaluations,
                tryouts,
                media,
                recruitment,
                academic,
                generatedAt: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error loading report data:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateAge = (dob) => {
        if (!dob) return 'N/A'
        const birth = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        return age
    }

    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getLatestBodyComp = () => {
        if (!reportData?.bodyComp?.length) return null
        return reportData.bodyComp[0]
    }

    const getBodyCompChange = () => {
        if (!reportData?.bodyComp || reportData.bodyComp.length < 2) return null
        const latest = reportData.bodyComp[0]
        const previous = reportData.bodyComp[1]
        return {
            weight: (latest.weight_kg - previous.weight_kg).toFixed(1),
            bodyFat: (latest.body_fat_percent - previous.body_fat_percent).toFixed(1),
            muscle: (latest.muscle_mass_kg - previous.muscle_mass_kg).toFixed(1)
        }
    }

    const getLatestEvaluation = () => {
        if (!reportData?.evaluations?.length) return null
        return reportData.evaluations[0]
    }

    const getPerformanceWithBenchmarks = () => {
        if (!reportData?.player || !reportData?.performance?.length) return []
        const ageGroup = getAgeGroup(reportData.player.date_of_birth)

        // Group by test type and get latest
        const testTypes = [...new Set(reportData.performance.map(t => t.test_type))]
        return testTypes.map(type => {
            const tests = reportData.performance
                .filter(t => t.test_type === type)
                .sort((a, b) => new Date(b.test_date) - new Date(a.test_date))

            const latest = tests[0]
            const first = tests[tests.length - 1]
            const benchmark = evaluatePerformance(type, latest.result, ageGroup)
            const benchmarkData = PERFORMANCE_BENCHMARKS[type]?.[ageGroup]

            // Calculate improvement (for sprints, negative is better)
            let improvement = null
            if (tests.length > 1) {
                const lowerIsBetter = ['sprint_10m', 'sprint_30m', 'agility_505'].includes(type)
                const diff = latest.result - first.result
                improvement = lowerIsBetter
                    ? ((first.result - latest.result) / first.result * 100).toFixed(1)
                    : ((latest.result - first.result) / first.result * 100).toFixed(1)
            }

            return {
                type,
                latest,
                first,
                benchmark,
                benchmarkData,
                improvement,
                ageGroup
            }
        })
    }

    const handlePrint = () => {
        window.print()
    }

    const handleGeneratePDF = async () => {
        setGenerating(true)
        // Use browser print to PDF for now
        setTimeout(() => {
            window.print()
            setGenerating(false)
        }, 100)
    }

    if (loading && !reportData) {
        return (
            <div className="report-page">
                <div className="loading-state">
                    <div className="spinner spinner-lg"></div>
                    <p>Loading report data...</p>
                </div>
            </div>
        )
    }

    const latestBodyComp = getLatestBodyComp()
    const bodyCompChange = getBodyCompChange()
    const latestEval = getLatestEvaluation()
    const performanceData = getPerformanceWithBenchmarks()

    return (
        <div className="report-page">
            {/* Controls (hidden in print) */}
            <div className="report-controls no-print">
                {/* Only show player selector for staff */}
                {isStaff && (
                    <div className="control-group">
                        <label>Select Player:</label>
                        <select
                            value={selectedPlayerId || ''}
                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                            className="input"
                        >
                            {players.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.first_name} {p.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                {!isStaff && (
                    <div className="control-group">
                        <h2 style={{ margin: 0 }}>My Progress Report</h2>
                        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                            Download or print this report to share with your parents
                        </p>
                    </div>
                )}
                <div className="control-actions">
                    <button className="btn btn-secondary" onClick={handlePrint}>
                        Print Report
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleGeneratePDF}
                        disabled={generating}
                    >
                        {generating ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="report-container" ref={reportRef}>
                    {/* PAGE 1: Player Overview & Development Review */}
                    <div className="report-page-content page-1">
                        {/* Header */}
                        <div className="report-header">
                            <div className="report-logo">
                                <img src="/fc-koln-logo.png" alt="1.FC Köln" />
                            </div>
                            <div className="report-title">
                                <h1>ITP Family Report</h1>
                                <p className="report-period">
                                    Report Date: {formatDate(reportData.generatedAt)}
                                </p>
                            </div>
                            <div className="report-logo">
                                <img src="/itp-logo.png" alt="ITP" />
                            </div>
                        </div>

                        {/* Player Info */}
                        <div className="player-info-section">
                            <div className="player-photo">
                                <div className="photo-placeholder">
                                    {reportData.player.first_name[0]}{reportData.player.last_name[0]}
                                </div>
                            </div>
                            <div className="player-details">
                                <h2>{reportData.player.first_name} {reportData.player.last_name}</h2>
                                <div className="player-meta">
                                    <span><strong>Position:</strong> {reportData.player.position}</span>
                                    <span><strong>Age:</strong> {calculateAge(reportData.player.date_of_birth)}</span>
                                    <span><strong>DOB:</strong> {formatDate(reportData.player.date_of_birth)}</span>
                                    <span><strong>Nationality:</strong> {reportData.player.nationality}</span>
                                </div>
                            </div>
                        </div>

                        {/* Physical Analysis */}
                        <div className="section physical-analysis">
                            <h3 className="section-title">Physical Analysis</h3>
                            {latestBodyComp ? (
                                <div className="body-comp-grid">
                                    <div className="body-comp-item">
                                        <span className="value">{latestBodyComp.height_cm} cm</span>
                                        <span className="label">Height</span>
                                    </div>
                                    <div className="body-comp-item">
                                        <span className="value">{latestBodyComp.weight_kg} kg</span>
                                        <span className="label">Weight</span>
                                        {bodyCompChange && (
                                            <span className={`change ${parseFloat(bodyCompChange.weight) > 0 ? 'positive' : 'negative'}`}>
                                                {bodyCompChange.weight > 0 ? '+' : ''}{bodyCompChange.weight} kg
                                            </span>
                                        )}
                                    </div>
                                    <div className="body-comp-item">
                                        <span className="value">{latestBodyComp.body_fat_percent}%</span>
                                        <span className="label">Body Fat</span>
                                        {bodyCompChange && (
                                            <span className={`change ${parseFloat(bodyCompChange.bodyFat) < 0 ? 'positive' : 'negative'}`}>
                                                {bodyCompChange.bodyFat > 0 ? '+' : ''}{bodyCompChange.bodyFat}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="body-comp-item">
                                        <span className="value">{latestBodyComp.muscle_mass_kg} kg</span>
                                        <span className="label">Muscle Mass</span>
                                        {bodyCompChange && (
                                            <span className={`change ${parseFloat(bodyCompChange.muscle) > 0 ? 'positive' : 'negative'}`}>
                                                {bodyCompChange.muscle > 0 ? '+' : ''}{bodyCompChange.muscle} kg
                                            </span>
                                        )}
                                    </div>
                                    <div className="body-comp-item">
                                        <span className="value">{latestBodyComp.bmi}</span>
                                        <span className="label">BMI</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="no-data">No body composition data available</p>
                            )}
                        </div>

                        {/* Development Review */}
                        {latestEval && (
                            <div className="section development-review">
                                <h3 className="section-title">Development Review</h3>
                                <div className="eval-grid">
                                    {/* Technical */}
                                    <div className="eval-category">
                                        <h4>Technical</h4>
                                        <div className="eval-scores">
                                            <div className="score-item">
                                                <span className="score-label">First Touch</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.technical_first_touch * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.technical_first_touch}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Passing</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.technical_passing * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.technical_passing}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Dribbling</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.technical_dribbling * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.technical_dribbling}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Shooting</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.technical_shooting * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.technical_shooting}/10</span>
                                            </div>
                                        </div>
                                        <p className="eval-notes">{latestEval.technical_notes}</p>
                                    </div>

                                    {/* Tactical */}
                                    <div className="eval-category">
                                        <h4>Tactical</h4>
                                        <div className="eval-scores">
                                            <div className="score-item">
                                                <span className="score-label">Positioning</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.tactical_positioning * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.tactical_positioning}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Game Reading</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.tactical_game_reading * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.tactical_game_reading}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Decision Making</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.tactical_decision_making * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.tactical_decision_making}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Pressing</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.tactical_pressing * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.tactical_pressing}/10</span>
                                            </div>
                                        </div>
                                        <p className="eval-notes">{latestEval.tactical_notes}</p>
                                    </div>

                                    {/* Physical */}
                                    <div className="eval-category">
                                        <h4>Physical</h4>
                                        <div className="eval-scores">
                                            <div className="score-item">
                                                <span className="score-label">Speed</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.physical_speed * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.physical_speed}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Endurance</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.physical_endurance * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.physical_endurance}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Strength</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.physical_strength * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.physical_strength}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Agility</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.physical_agility * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.physical_agility}/10</span>
                                            </div>
                                        </div>
                                        <p className="eval-notes">{latestEval.physical_notes}</p>
                                    </div>

                                    {/* Mental */}
                                    <div className="eval-category">
                                        <h4>Mental</h4>
                                        <div className="eval-scores">
                                            <div className="score-item">
                                                <span className="score-label">Focus</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.mental_focus * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.mental_focus}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Composure</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.mental_composure * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.mental_composure}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Work Rate</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.mental_work_rate * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.mental_work_rate}/10</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Coachability</span>
                                                <div className="score-bar">
                                                    <div className="score-fill" style={{ width: `${latestEval.mental_coachability * 10}%` }}></div>
                                                </div>
                                                <span className="score-value">{latestEval.mental_coachability}/10</span>
                                            </div>
                                        </div>
                                        <p className="eval-notes">{latestEval.mental_notes}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="page-number">Page 1 of 4</div>
                    </div>

                    {/* PAGE 2: Performance Tests with Benchmarks */}
                    <div className="report-page-content page-2 page-break">
                        <div className="section performance-tests">
                            <h3 className="section-title">Performance Tests vs European Academy Benchmarks</h3>

                            {performanceData.length > 0 ? (
                                <div className="performance-grid">
                                    {performanceData.map(({ type, latest, first, benchmark, benchmarkData, improvement, ageGroup }) => (
                                        <div key={type} className="performance-test-card">
                                            <div className="test-header">
                                                <h4>{type.replace(/_/g, ' ').toUpperCase()}</h4>
                                                <span className={`benchmark-badge ${benchmark.color}`}>
                                                    {benchmark.level.toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="test-result">
                                                <span className="current-value">{latest.result}</span>
                                                <span className="unit">{latest.unit}</span>
                                            </div>

                                            {improvement && (
                                                <div className={`improvement ${parseFloat(improvement) > 0 ? 'positive' : 'negative'}`}>
                                                    {parseFloat(improvement) > 0 ? '+' : ''}{improvement}% from initial
                                                </div>
                                            )}

                                            {benchmarkData && (
                                                <div className="benchmark-comparison">
                                                    <div className="benchmark-header">
                                                        <span>European {ageGroup} Benchmarks</span>
                                                    </div>
                                                    <div className="benchmark-scale">
                                                        <div className="scale-labels">
                                                            <span>Developing</span>
                                                            <span>Average</span>
                                                            <span>Good</span>
                                                            <span>Elite</span>
                                                        </div>
                                                        <div className="scale-values">
                                                            <span>{benchmarkData.developing}</span>
                                                            <span>{benchmarkData.average}</span>
                                                            <span>{benchmarkData.good}</span>
                                                            <span>{benchmarkData.elite}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {first && first.id !== latest.id && (
                                                <div className="progress-comparison">
                                                    <div className="progress-item">
                                                        <span className="label">Initial ({formatDate(first.test_date).split(',')[0]})</span>
                                                        <span className="value">{first.result} {first.unit}</span>
                                                    </div>
                                                    <div className="progress-arrow">
                                                        {parseFloat(improvement) > 0 ? '...' : '...'}
                                                    </div>
                                                    <div className="progress-item">
                                                        <span className="label">Current ({formatDate(latest.test_date).split(',')[0]})</span>
                                                        <span className="value">{latest.result} {latest.unit}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No performance test data available</p>
                            )}
                        </div>

                        {/* Key Strengths & Areas for Improvement */}
                        {latestEval && (
                            <div className="section strengths-improvements">
                                <div className="si-grid">
                                    <div className="si-card strengths">
                                        <h4>Key Strengths</h4>
                                        <p>{latestEval.key_strengths}</p>
                                    </div>
                                    <div className="si-card improvements">
                                        <h4>Areas for Improvement</h4>
                                        <p>{latestEval.areas_for_improvement}</p>
                                    </div>
                                </div>
                                <div className="goals-section">
                                    <div className="goal-item">
                                        <h5>Short-Term Goals</h5>
                                        <p>{latestEval.short_term_goals}</p>
                                    </div>
                                    <div className="goal-item">
                                        <h5>Long-Term Potential</h5>
                                        <p>{latestEval.long_term_potential}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="page-number">Page 2 of 4</div>
                    </div>

                    {/* PAGE 3: Mid-Term Evaluation & Tryout Reports */}
                    <div className="report-page-content page-3 page-break">
                        {/* Overall Assessment */}
                        {latestEval && (
                            <div className="section overall-assessment">
                                <h3 className="section-title">Mid-Term Evaluation</h3>
                                <div className="assessment-header">
                                    <div className="overall-rating">
                                        <span className="rating-value">{latestEval.overall_rating}</span>
                                        <span className="rating-label">Overall Rating</span>
                                    </div>
                                    <div className="development-stage">
                                        <span className={`stage-badge ${latestEval.development_stage}`}>
                                            {latestEval.development_stage?.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className="stage-label">Development Stage</span>
                                    </div>
                                    <div className="eval-date">
                                        <span className="date-value">{formatDate(latestEval.evaluation_date)}</span>
                                        <span className="date-label">Evaluation Date</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tryout Reports */}
                        <div className="section tryout-reports">
                            <h3 className="section-title">Tryout Reports</h3>
                            {reportData.tryouts?.length > 0 ? (
                                <div className="tryout-list">
                                    {reportData.tryouts.map(tryout => (
                                        <div key={tryout.id} className="tryout-card">
                                            <div className="tryout-header">
                                                <h4>{tryout.organization}</h4>
                                                <span className={`result-badge ${tryout.result}`}>
                                                    {tryout.result.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="tryout-meta">
                                                <span>{formatDate(tryout.tryout_date)}</span>
                                                <span>{tryout.tryout_type.replace('_', ' ')}</span>
                                                <span>{tryout.duration_days} day(s)</span>
                                            </div>
                                            <p className="tryout-feedback">{tryout.feedback}</p>
                                            {tryout.next_steps && (
                                                <p className="tryout-next-steps">
                                                    <strong>Next Steps:</strong> {tryout.next_steps}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No tryout reports available</p>
                            )}
                        </div>

                        {/* Recruitment Status */}
                        <div className="section recruitment-status">
                            <h3 className="section-title">Recruitment Status</h3>
                            {reportData.recruitment?.length > 0 ? (
                                <div className="recruitment-grid">
                                    {reportData.recruitment.slice(0, 4).map(target => (
                                        <div key={target.id} className="recruitment-card">
                                            <div className="recruitment-header">
                                                <h4>{target.college_name || target.name}</h4>
                                                <span className={`interest-badge ${target.interest_level}`}>
                                                    {target.interest_level}
                                                </span>
                                            </div>
                                            <div className="recruitment-details">
                                                <span>{target.division} {target.conference && `- ${target.conference}`}</span>
                                                <span>{target.location}</span>
                                            </div>
                                            <span className={`status-badge ${target.status}`}>
                                                {target.status?.replace('_', ' ')}
                                            </span>
                                            {target.scholarship_amount && (
                                                <div className="scholarship">
                                                    {target.scholarship_amount}% Scholarship
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No recruitment targets available</p>
                            )}
                        </div>

                        <div className="page-number">Page 3 of 4</div>
                    </div>

                    {/* PAGE 4: Media Links */}
                    <div className="report-page-content page-4 page-break">
                        <div className="section media-links">
                            <h3 className="section-title">Media & Highlight Links</h3>
                            {reportData.media?.length > 0 ? (
                                <div className="media-list">
                                    {reportData.media.map(item => (
                                        <div key={item.id} className="media-item">
                                            <div className="media-icon">
                                                {item.media_type === 'highlight_reel' ? '...' : '...'}
                                            </div>
                                            <div className="media-info">
                                                <h4>{item.title}</h4>
                                                <span className="media-type">
                                                    {item.media_type.replace('_', ' ')}
                                                </span>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                    {item.url}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No media links available</p>
                            )}
                        </div>

                        {/* Academic Summary */}
                        {reportData.academic?.length > 0 && (
                            <div className="section academic-summary">
                                <h3 className="section-title">Academic Progress Summary</h3>
                                <div className="academic-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">
                                            {reportData.academic.filter(a => a.status === 'completed').length}
                                        </span>
                                        <span className="stat-label">Courses Completed</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">
                                            {reportData.academic
                                                .filter(a => a.status === 'completed')
                                                .reduce((sum, a) => sum + (a.credits || 0), 0)}
                                        </span>
                                        <span className="stat-label">Total Credits</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">
                                            {reportData.academic.filter(a => a.status === 'in_progress').length}
                                        </span>
                                        <span className="stat-label">In Progress</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="report-footer">
                            <div className="footer-content">
                                <p>
                                    This report was generated by the ITP Management System on {formatDate(reportData.generatedAt)}.
                                </p>
                                <p>
                                    For questions about this report, contact: <a href="mailto:coaches@fckoeln-itp.com">coaches@fckoeln-itp.com</a>
                                </p>
                            </div>
                            <div className="footer-logos">
                                <span>1.FC Köln International Training Program</span>
                            </div>
                        </div>

                        <div className="page-number">Page 4 of 4</div>
                    </div>
                </div>
            )}
        </div>
    )
}
