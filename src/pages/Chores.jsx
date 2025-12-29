import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Chores.css'

export default function Chores() {
    const { isStaff } = useAuth()
    const [chores, setChores] = useState([])
    const [filter, setFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [selectedChore, setSelectedChore] = useState(null)

    useEffect(() => {
        setChores(demoData.chores)
    }, [])

    const filteredChores = chores.filter(chore => {
        if (filter === 'all') return true
        if (filter === 'pending') return chore.status === 'pending'
        if (filter === 'completed') return chore.status === 'completed'
        return true
    })

    const getPlayerName = (playerId) => {
        const player = demoData.players.find(p => p.id === playerId)
        return player ? `${player.first_name} ${player.last_name}` : 'Unassigned'
    }

    const getHouseName = (houseId) => {
        const house = demoData.houses.find(h => h.id === houseId)
        return house?.name || 'Unknown'
    }

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'error',
            medium: 'warning',
            low: 'success'
        }
        return colors[priority] || 'info'
    }

    const handleComplete = (choreId) => {
        setChores(prev => prev.map(c =>
            c.id === choreId
                ? { ...c, status: 'completed', completed_at: new Date().toISOString() }
                : c
        ))
    }

    const openModal = (chore = null) => {
        setSelectedChore(chore)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedChore(null)
    }

    const handleSaveChore = (e) => {
        e.preventDefault()
        const form = e.target
        const newChore = {
            id: selectedChore?.id || `ch${Date.now()}`,
            title: form.title.value,
            description: form.description.value,
            priority: form.priority.value,
            house_id: form.house.value,
            assigned_to: form.assignedTo.value,
            deadline: form.deadline.value,
            points: parseInt(form.points.value),
            status: selectedChore?.status || 'pending'
        }

        if (selectedChore) {
            setChores(prev => prev.map(c => c.id === selectedChore.id ? newChore : c))
        } else {
            setChores(prev => [...prev, newChore])
        }
        closeModal()
    }

    const stats = {
        total: chores.length,
        pending: chores.filter(c => c.status === 'pending').length,
        completed: chores.filter(c => c.status === 'completed').length,
        totalPoints: chores.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.points, 0)
    }

    return (
        <div className="chores-page">
            {/* Stats */}
            <div className="chores-stats">
                <div className="glass-card-static chore-stat-card">
                    <span className="stat-icon">📋</span>
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total Chores</span>
                </div>
                <div className="glass-card-static chore-stat-card">
                    <span className="stat-icon">⏳</span>
                    <span className="stat-value pending">{stats.pending}</span>
                    <span className="stat-label">Pending</span>
                </div>
                <div className="glass-card-static chore-stat-card">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value completed">{stats.completed}</span>
                    <span className="stat-label">Completed</span>
                </div>
                <div className="glass-card-static chore-stat-card">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value points">{stats.totalPoints}</span>
                    <span className="stat-label">Points Earned</span>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="glass-card-static chores-toolbar">
                <div className="filter-tabs">
                    {['all', 'pending', 'completed'].map(f => (
                        <button
                            key={f}
                            className={`filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            <span className="tab-count">
                                {f === 'all' ? stats.total : f === 'pending' ? stats.pending : stats.completed}
                            </span>
                        </button>
                    ))}
                </div>
                {isStaff && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        + Create Chore
                    </button>
                )}
            </div>

            {/* Chores List */}
            <div className="chores-list">
                {filteredChores.map(chore => (
                    <div key={chore.id} className={`glass-card chore-card ${chore.status}`}>
                        <div className="chore-header">
                            <div className="chore-title-section">
                                <h3 className="chore-title">{chore.title}</h3>
                                <div className="chore-badges">
                                    <span className={`badge badge-${getPriorityColor(chore.priority)}`}>
                                        {chore.priority}
                                    </span>
                                    <span className="badge badge-primary">
                                        {chore.points} pts
                                    </span>
                                </div>
                            </div>
                            <span className={`chore-status-badge ${chore.status}`}>
                                {chore.status === 'completed' ? '✓ Done' : '⏳ Pending'}
                            </span>
                        </div>

                        <p className="chore-description">{chore.description}</p>

                        <div className="chore-meta">
                            <div className="meta-item">
                                <span className="meta-icon">🏠</span>
                                <span>{getHouseName(chore.house_id)}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">👤</span>
                                <span>{getPlayerName(chore.assigned_to)}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">📅</span>
                                <span>{new Date(chore.deadline).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {isStaff && chore.status === 'pending' && (
                            <div className="chore-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => openModal(chore)}>
                                    Edit
                                </button>
                                <button className="btn btn-success btn-sm" onClick={() => handleComplete(chore.id)}>
                                    Mark Complete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredChores.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <h3 className="empty-state-title">No chores found</h3>
                    <p className="empty-state-description">
                        {filter === 'pending' ? 'All chores are completed!' : 'No chores match your filter'}
                    </p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {selectedChore ? 'Edit Chore' : 'Create New Chore'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSaveChore}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Title</label>
                                    <input
                                        name="title"
                                        className="input"
                                        defaultValue={selectedChore?.title}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <textarea
                                        name="description"
                                        className="input textarea"
                                        rows="3"
                                        defaultValue={selectedChore?.description}
                                    />
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Priority</label>
                                        <select name="priority" className="input" defaultValue={selectedChore?.priority || 'medium'}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Points</label>
                                        <input
                                            name="points"
                                            type="number"
                                            className="input"
                                            min="1"
                                            max="100"
                                            defaultValue={selectedChore?.points || 10}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">House</label>
                                        <select name="house" className="input" defaultValue={selectedChore?.house_id || 'h1'}>
                                            {demoData.houses.map(h => (
                                                <option key={h.id} value={h.id}>{h.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Assign To</label>
                                        <select name="assignedTo" className="input" defaultValue={selectedChore?.assigned_to || ''}>
                                            <option value="">-- Select Player --</option>
                                            {demoData.players.map(p => (
                                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Deadline</label>
                                        <input
                                            name="deadline"
                                            type="date"
                                            className="input"
                                            defaultValue={selectedChore?.deadline?.split('T')[0] || ''}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedChore ? 'Save Changes' : 'Create Chore'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
