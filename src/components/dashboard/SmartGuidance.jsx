import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNextSteps } from '../../lib/data-service'
import { Target, Circle, Heart, CheckCircle, GraduationCap, BookOpen, MapPin, Sparkles, Lightbulb } from 'lucide-react'
import './SmartGuidance.css'

/**
 * SmartGuidance Component
 * Displays personalized next steps and priorities for the player
 * Solves the "Don't know what to do next" problem
 */
export default function SmartGuidance({ playerId }) {
    const navigate = useNavigate()
    const [nextSteps, setNextSteps] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (playerId) {
            loadNextSteps()
        }
    }, [playerId])

    const loadNextSteps = async () => {
        if (!playerId) return;

        try {
            setLoading(true)
            const steps = await getNextSteps(playerId)
            setNextSteps(steps)
        } catch (error) {
            console.error('Error loading next steps:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!playerId) {
        return null;
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return '#E30613' // FC Köln red
            case 'medium':
                return '#00E5FF' // Cyber blue
            case 'low':
                return '#4CAF50' // Green
            default:
                return '#888'
        }
    }

    const getPriorityIcon = (priority) => {
        const colors = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' }
        const color = colors[priority] || '#888'
        return <Circle size={12} fill={color} color={color} />
    }

    const getCategoryIcon = (category) => {
        const iconProps = { size: 16 }
        switch (category) {
            case 'wellness':
                return <Heart {...iconProps} style={{ color: '#22C55E' }} />
            case 'tasks':
                return <CheckCircle {...iconProps} />
            case 'recruitment':
                return <GraduationCap {...iconProps} />
            case 'academics':
                return <BookOpen {...iconProps} />
            default:
                return <MapPin {...iconProps} />
        }
    }

    if (loading) {
        return (
            <div className="smart-guidance">
                <div className="smart-guidance-header">
                    <h3><Target size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Your Next Steps</h3>
                    <p>Loading personalized guidance...</p>
                </div>
            </div>
        )
    }

    if (nextSteps.length === 0) {
        return (
            <div className="smart-guidance">
                <div className="smart-guidance-header">
                    <h3><Target size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Your Next Steps</h3>
                    <p>All caught up! Great work.</p>
                </div>
                <div className="all-clear">
                    <div className="success-icon"><Sparkles size={48} /></div>
                    <h4>You're All Set!</h4>
                    <p>No pending tasks right now. Keep up the excellent work!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="smart-guidance">
            <div className="smart-guidance-header">
                <h3><Target size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Your Next Steps</h3>
                <p>Focus on these priorities today</p>
            </div>

            <div className="next-steps-list">
                {nextSteps.map((step, index) => (
                    <div
                        key={step.id}
                        className="next-step-card"
                        onClick={() => navigate(step.action)}
                        style={{
                            borderLeft: `4px solid ${getPriorityColor(step.priority)}`,
                            animationDelay: `${index * 0.1}s`
                        }}
                    >
                        <div className="step-header">
                            <div className="step-number">{index + 1}</div>
                            <div className="step-icons">
                                <span className="category-icon">{getCategoryIcon(step.category)}</span>
                                <span className="priority-icon">{getPriorityIcon(step.priority)}</span>
                            </div>
                        </div>

                        <div className="step-content">
                            <h4>{step.title}</h4>
                            <p>{step.description}</p>
                        </div>

                        <div className="step-footer">
                            <span className="step-category">{step.category}</span>
                            <span className="step-action">
                                Take Action →
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="guidance-footer">
                <p><Lightbulb size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Tip: Focus on high-priority items first for maximum impact</p>
            </div>
        </div>
    )
}
