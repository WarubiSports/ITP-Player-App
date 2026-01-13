import { useState, useEffect } from 'react'
import { getPlayerGoals, createGoal, updateGoal } from '../../lib/data-service'
import { useConfetti } from '../celebrations/Confetti'
import { useNotification } from '../../contexts/NotificationContext'
import { Target, Dumbbell, Zap, BookOpen, Star, MapPin, Circle, Calendar, Sparkles, Check } from 'lucide-react'
import './GoalsWidget.css'

export default function GoalsWidget({ playerId, compact = false }) {
    const [goals, setGoals] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const { showConfetti, triggerConfetti, ConfettiComponent } = useConfetti()
    const notification = useNotification()

    useEffect(() => {
        if (playerId) {
            loadGoals()
        }
    }, [playerId])

    const loadGoals = async () => {
        try {
            const playerGoals = await getPlayerGoals(playerId)
            // Sort by priority and status
            const sorted = playerGoals.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                const statusOrder = { in_progress: 0, completed: 1, abandoned: 2 }

                if (a.status !== b.status) {
                    return statusOrder[a.status] - statusOrder[b.status]
                }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
            })
            setGoals(sorted)
        } catch (error) {
            console.error('Error loading goals:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGoal = async (e) => {
        e.preventDefault()
        const form = e.target

        const newGoal = {
            player_id: playerId,
            title: form.title.value,
            description: form.description.value,
            category: form.category.value,
            goal_type: form.goalType.value,
            target_value: form.targetValue.value ? parseFloat(form.targetValue.value) : null,
            unit: form.unit.value || null,
            target_date: form.targetDate.value || null,
            priority: form.priority.value
        }

        try {
            const created = await createGoal(newGoal)
            setGoals(prev => [created, ...prev])
            setShowAddForm(false)
            form.reset()
        } catch (error) {
            console.error('Error creating goal:', error)
            alert('Failed to create goal. Please try again.')
        }
    }

    const handleUpdateProgress = async (goalId, currentValue) => {
        try {
            const goal = goals.find(g => g.id === goalId)
            const wasCompleted = goal.status === 'completed'
            const isCompleted = currentValue >= goal.target_value

            const updated = await updateGoal(goalId, {
                current_value: currentValue,
                status: isCompleted ? 'completed' : 'in_progress',
                completed_at: isCompleted ? new Date().toISOString() : null
            })

            setGoals(prev => prev.map(g => g.id === goalId ? updated : g))

            // Celebrate goal completion!
            if (isCompleted && !wasCompleted) {
                triggerConfetti()
                notification?.achievement?.('Goal Achieved!', goal.title, '🎯')
            }
        } catch (error) {
            console.error('Error updating goal:', error)
        }
    }

    const getCategoryIcon = (category) => {
        const iconProps = { size: 16 }
        switch (category) {
            case 'wellness': return <Dumbbell {...iconProps} />
            case 'performance': return <Zap {...iconProps} />
            case 'academic': return <BookOpen {...iconProps} />
            case 'recruitment': return <Target {...iconProps} />
            case 'personal': return <Star {...iconProps} />
            default: return <MapPin {...iconProps} />
        }
    }

    const getPriorityColor = (priority) => {
        const colors = {
            high: '#E30613',
            medium: '#F59E0B',
            low: '#10B981'
        }
        return colors[priority] || '#6B7280'
    }

    const getProgressPercentage = (goal) => {
        if (!goal.target_value) return 0
        return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
    }

    const activeGoals = goals.filter(g => g.status === 'in_progress')
    const completedGoals = goals.filter(g => g.status === 'completed')

    if (loading) {
        return (
            <div className="goals-widget">
                <div className="loading">Loading goals...</div>
            </div>
        )
    }

    if (compact) {
        return (
            <div className="goals-widget-compact">
                <div className="goals-header">
                    <h4><Target size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Active Goals</h4>
                    <button className="btn-icon" onClick={() => setShowAddForm(true)}>+</button>
                </div>
                <div className="goals-list-compact">
                    {activeGoals.slice(0, 3).map(goal => (
                        <div key={goal.id} className="goal-item-compact">
                            <div className="goal-info">
                                <span className="goal-icon">{getCategoryIcon(goal.category)}</span>
                                <span className="goal-title">{goal.title}</span>
                            </div>
                            <div className="goal-progress-mini">
                                <div className="progress-bar-mini">
                                    <div
                                        className="progress-fill-mini"
                                        style={{ width: `${getProgressPercentage(goal)}%` }}
                                    />
                                </div>
                                <span className="progress-text">{getProgressPercentage(goal)}%</span>
                            </div>
                        </div>
                    ))}
                </div>
                {activeGoals.length === 0 && (
                    <div className="empty-state-compact">
                        <p>No active goals yet</p>
                        <button className="btn-link" onClick={() => setShowAddForm(true)}>
                            Set your first goal
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="goals-widget">
            <ConfettiComponent />
            <div className="goals-widget-header">
                <div>
                    <h3><Target size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />My Goals</h3>
                    <p>{activeGoals.length} active • {completedGoals.length} completed</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Cancel' : '+ Add Goal'}
                </button>
            </div>

            {showAddForm && (
                <div className="glass-card goal-form">
                    <h4>Create New Goal</h4>
                    <form onSubmit={handleCreateGoal}>
                        <div className="form-row">
                            <div className="input-group">
                                <label className="input-label">Goal Title *</label>
                                <input
                                    name="title"
                                    className="input"
                                    placeholder="e.g., Improve sprint time"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Category *</label>
                                <select name="category" className="input" required>
                                    <option value="wellness">Wellness</option>
                                    <option value="performance">Performance</option>
                                    <option value="academic">Academic</option>
                                    <option value="recruitment">Recruitment</option>
                                    <option value="personal">Personal</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description</label>
                            <textarea
                                name="description"
                                className="input"
                                rows="2"
                                placeholder="What do you want to achieve?"
                            />
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label className="input-label">Goal Type *</label>
                                <select name="goalType" className="input" required>
                                    <option value="short_term">Short-term (1-3 months)</option>
                                    <option value="long_term">Long-term (3+ months)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Priority *</label>
                                <select name="priority" className="input" required>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label className="input-label">Target Value</label>
                                <input
                                    name="targetValue"
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    placeholder="e.g., 4.0 (for GPA)"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Unit</label>
                                <input
                                    name="unit"
                                    className="input"
                                    placeholder="e.g., seconds, GPA, offers"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Target Date</label>
                            <input
                                name="targetDate"
                                type="date"
                                className="input"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Goal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="goals-list">
                {activeGoals.length > 0 && (
                    <div className="goals-section">
                        <h4 className="section-title">Active Goals</h4>
                        {activeGoals.map(goal => (
                            <div key={goal.id} className="goal-card glass-card">
                                <div className="goal-header">
                                    <div className="goal-title-row">
                                        <span className="goal-category-icon">{getCategoryIcon(goal.category)}</span>
                                        <h5>{goal.title}</h5>
                                        <span
                                            className="goal-priority-dot"
                                            style={{ backgroundColor: getPriorityColor(goal.priority) }}
                                            title={`${goal.priority} priority`}
                                        />
                                    </div>
                                    <span className="goal-type-badge">{goal.goal_type.replace('_', '-')}</span>
                                </div>

                                {goal.description && <p className="goal-description">{goal.description}</p>}

                                {goal.target_value && (
                                    <div className="goal-progress">
                                        <div className="progress-info">
                                            <span>{goal.current_value || 0} / {goal.target_value} {goal.unit}</span>
                                            <span>{getProgressPercentage(goal)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${getProgressPercentage(goal)}%` }}
                                            />
                                        </div>
                                        <div className="progress-update">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input-sm"
                                                placeholder="Update progress"
                                                onBlur={(e) => {
                                                    if (e.target.value) {
                                                        handleUpdateProgress(goal.id, parseFloat(e.target.value))
                                                        e.target.value = ''
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {goal.target_date && (
                                    <div className="goal-deadline">
                                        <Calendar size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                        Target: {new Date(goal.target_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {completedGoals.length > 0 && (
                    <div className="goals-section">
                        <h4 className="section-title">Completed Goals <Sparkles size={16} style={{ marginLeft: '0.25rem', verticalAlign: 'middle' }} /></h4>
                        {completedGoals.slice(0, 5).map(goal => (
                            <div key={goal.id} className="goal-card glass-card completed">
                                <div className="goal-header">
                                    <div className="goal-title-row">
                                        <span className="goal-category-icon">{getCategoryIcon(goal.category)}</span>
                                        <h5>{goal.title}</h5>
                                        <span className="goal-completed-badge"><Check size={14} /></span>
                                    </div>
                                </div>
                                <p className="goal-completed-date">
                                    Completed {new Date(goal.completed_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {activeGoals.length === 0 && completedGoals.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon"><Target size={48} /></div>
                        <h4>No Goals Yet</h4>
                        <p>Set your first goal to start tracking your progress</p>
                        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                            Create Your First Goal
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
