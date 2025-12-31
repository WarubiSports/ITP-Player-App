import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getHouses, getPlayers, getChores, createChore, updateChore, completeChore } from '../lib/data-service'
import './Housing.css'

export default function Housing() {
    const { profile, isStaff } = useAuth()
    const [houses, setHouses] = useState([])
    const [chores, setChores] = useState([])
    const [players, setPlayers] = useState([])
    const [playerData, setPlayerData] = useState(null)
    const [selectedHouse, setSelectedHouse] = useState(null)
    const [showChoreModal, setShowChoreModal] = useState(false)
    const [selectedChore, setSelectedChore] = useState(null)
    const [filter, setFilter] = useState('pending')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [profile?.id])

    const loadData = async () => {
        try {
            setLoading(true)
            const [housesData, playersData, choresData] = await Promise.all([
                getHouses(),
                getPlayers(),
                getChores()
            ])

            setHouses(housesData || [])
            setPlayers(playersData || [])
            setChores(choresData || [])

            // Find current player
            const player = playersData?.find(p => p.id === profile.id || p.user_id === profile.id)
            setPlayerData(player)
        } catch (error) {
            console.error('Error loading housing data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getHouseStats = (house) => {
        const residents = players.filter(p => p.house_id === house.id)
        const houseChores = chores.filter(c => c.house_id === house.id)
        const completedChores = houseChores.filter(c => c.status === 'completed').length
        const pendingChores = houseChores.filter(c => c.status === 'pending').length

        return {
            ...house,
            residents,
            chores: houseChores,
            completedChores,
            pendingChores,
            completionRate: houseChores.length > 0
                ? Math.round((completedChores / houseChores.length) * 100)
                : 100
        }
    }

    const housesWithStats = houses.map(getHouseStats).sort((a, b) => b.total_points - a.total_points)

    const filteredChores = chores.filter(chore => {
        // For players, show only their assigned chores
        if (!isStaff && playerData) {
            if (chore.assigned_to !== playerData.id) return false
        }

        // Apply status filter
        if (filter === 'pending') return chore.status === 'pending'
        if (filter === 'completed') return chore.status === 'completed'
        return true
    })

    const handleCompleteChore = async (choreId) => {
        try {
            await completeChore(choreId)
            await loadData()
        } catch (error) {
            console.error('Error completing chore:', error)
            alert('Failed to complete chore. Please try again.')
        }
    }

    const handleSaveChore = async (e) => {
        e.preventDefault()
        const form = e.target

        const choreData = {
            title: form.title.value,
            description: form.description.value,
            priority: form.priority.value,
            house_id: form.house.value,
            assigned_to: form.assignedTo.value || null,
            deadline: form.deadline.value || null,
            points: parseInt(form.points.value)
        }

        try {
            if (selectedChore) {
                await updateChore(selectedChore.id, choreData)
            } else {
                await createChore(choreData)
            }
            await loadData()
            setShowChoreModal(false)
            setSelectedChore(null)
        } catch (error) {
            console.error('Error saving chore:', error)
            alert('Failed to save chore. Please try again.')
        }
    }

    const getPlayerName = (playerId) => {
        const player = players.find(p => p.id === playerId)
        return player ? `${player.first_name} ${player.last_name}` : 'Unassigned'
    }

    const getHouseName = (houseId) => {
        const house = houses.find(h => h.id === houseId)
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

    const getRankIcon = (index) => ['🥇', '🥈', '🥉'][index] || ''

    const choreStats = {
        total: chores.length,
        pending: chores.filter(c => c.status === 'pending').length,
        completed: chores.filter(c => c.status === 'completed').length,
        myPending: playerData ? chores.filter(c => c.assigned_to === playerData.id && c.status === 'pending').length : 0
    }

    if (loading) {
        return (
            <div className="housing-page">
                <div className="loading-state">Loading...</div>
            </div>
        )
    }

    return (
        <div className="housing-page">
            <header className="page-header">
                <div>
                    <h1>🏠 House & Tasks</h1>
                    <p>House standings and your assigned chores</p>
                </div>
            </header>

            {/* House Leaderboard */}
            <div className="housing-overview">
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">🏠</div>
                    <div className="overview-content">
                        <span className="overview-value">{houses.length}</span>
                        <span className="overview-label">Active Houses</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">✅</div>
                    <div className="overview-content">
                        <span className="overview-value">{choreStats.completed}</span>
                        <span className="overview-label">Completed Today</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">📝</div>
                    <div className="overview-content">
                        <span className="overview-value">{choreStats.pending}</span>
                        <span className="overview-label">Pending Tasks</span>
                    </div>
                </div>
                {!isStaff && (
                    <div className="glass-card-static overview-card highlight">
                        <div className="overview-icon">👤</div>
                        <div className="overview-content">
                            <span className="overview-value">{choreStats.myPending}</span>
                            <span className="overview-label">Your Tasks</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Houses Grid */}
            <div className="houses-grid">
                {housesWithStats.map((house, idx) => (
                    <div
                        key={house.id}
                        className={`glass-card house-card rank-${idx + 1}`}
                        onClick={() => setSelectedHouse(house)}
                    >
                        <div className="house-card-header">
                            <div className="house-rank">{getRankIcon(idx)}</div>
                            <h3 className="house-name">{house.name}</h3>
                            <div className="house-points">
                                <span className="points-num">{house.total_points}</span>
                                <span className="points-label">pts</span>
                            </div>
                        </div>

                        <div className="house-stats">
                            <div className="house-stat">
                                <span className="stat-icon">👥</span>
                                <span className="stat-value">{house.residents.length}</span>
                                <span className="stat-label">Residents</span>
                            </div>
                            <div className="house-stat">
                                <span className="stat-icon">✅</span>
                                <span className="stat-value">{house.completionRate}%</span>
                                <span className="stat-label">Completion</span>
                            </div>
                            <div className="house-stat">
                                <span className="stat-icon">📝</span>
                                <span className="stat-value">{house.pendingChores}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                        </div>

                        <button className="btn btn-secondary w-full view-details-btn">
                            View Details →
                        </button>
                    </div>
                ))}
            </div>

            {/* Chores Section */}
            <div style={{ marginTop: 'var(--space-8)' }}>
                <div className="glass-card-static chores-toolbar">
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
                        {isStaff ? '📋 All Tasks' : '✅ Your Tasks'}
                    </h2>
                    <div className="filter-tabs">
                        {['pending', 'completed', 'all'].map(f => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    {isStaff && (
                        <button className="btn btn-primary" onClick={() => { setSelectedChore(null); setShowChoreModal(true); }}>
                            + Create Task
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

                            {chore.description && <p className="chore-description">{chore.description}</p>}

                            <div className="chore-meta">
                                <div className="meta-item">
                                    <span className="meta-icon">🏠</span>
                                    <span>{getHouseName(chore.house_id)}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-icon">👤</span>
                                    <span>{getPlayerName(chore.assigned_to)}</span>
                                </div>
                                {chore.deadline && (
                                    <div className="meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span>{new Date(chore.deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {chore.status === 'pending' && (
                                <div className="chore-actions">
                                    {isStaff && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedChore(chore); setShowChoreModal(true); }}>
                                            Edit
                                        </button>
                                    )}
                                    {(isStaff || (playerData && chore.assigned_to === playerData.id)) && (
                                        <button className="btn btn-success btn-sm" onClick={() => handleCompleteChore(chore.id)}>
                                            ✓ Mark Complete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredChores.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <h3>No tasks found</h3>
                        <p>
                            {filter === 'pending'
                                ? isStaff ? 'No pending tasks' : 'You have no pending tasks. Great work!'
                                : 'No tasks match your filter'}
                        </p>
                    </div>
                )}
            </div>

            {/* House Detail Modal */}
            {selectedHouse && (
                <div className="modal-overlay" onClick={() => setSelectedHouse(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header house-modal-header">
                            <div>
                                <h3 className="modal-title">{selectedHouse.name}</h3>
                                <p className="modal-subtitle">{selectedHouse.total_points} points</p>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedHouse(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="house-detail-stats">
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{selectedHouse.residents.length}</span>
                                    <span className="detail-stat-label">Residents</span>
                                </div>
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{selectedHouse.completionRate}%</span>
                                    <span className="detail-stat-label">Chore Completion</span>
                                </div>
                                <div className="detail-stat">
                                    <span className="detail-stat-value">{selectedHouse.pendingChores}</span>
                                    <span className="detail-stat-label">Pending Tasks</span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Residents</h4>
                                <div className="residents-list">
                                    {selectedHouse.residents.map(resident => (
                                        <div key={resident.id} className="resident-item">
                                            <div className="avatar avatar-sm">
                                                {resident.first_name[0]}{resident.last_name[0]}
                                            </div>
                                            <div className="resident-info">
                                                <span className="resident-name">{resident.first_name} {resident.last_name}</span>
                                                <span className="resident-position">{resident.position}</span>
                                            </div>
                                            <span className="badge">{resident.points} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Chore Modal */}
            {showChoreModal && (
                <div className="modal-overlay" onClick={() => setShowChoreModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {selectedChore ? 'Edit Task' : 'Create New Task'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowChoreModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveChore}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Title *</label>
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
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div className="input-group">
                                        <label className="input-label">Priority *</label>
                                        <select name="priority" className="input" defaultValue={selectedChore?.priority || 'medium'} required>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Points *</label>
                                        <input
                                            name="points"
                                            type="number"
                                            className="input"
                                            min="1"
                                            max="100"
                                            defaultValue={selectedChore?.points || 10}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">House *</label>
                                        <select name="house" className="input" defaultValue={selectedChore?.house_id} required>
                                            {houses.map(h => (
                                                <option key={h.id} value={h.id}>{h.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Assign To</label>
                                        <select name="assignedTo" className="input" defaultValue={selectedChore?.assigned_to || ''}>
                                            <option value="">-- Select Player --</option>
                                            {players.map(p => (
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowChoreModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedChore ? 'Save Changes' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
