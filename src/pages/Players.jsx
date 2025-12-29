import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Players.css'

export default function Players() {
    const { isStaff } = useAuth()
    const [players, setPlayers] = useState([])
    const [filteredPlayers, setFilteredPlayers] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [positionFilter, setPositionFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [selectedPlayer, setSelectedPlayer] = useState(null)

    useEffect(() => {
        setPlayers(demoData.players)
        setFilteredPlayers(demoData.players)
    }, [])

    useEffect(() => {
        let result = players

        if (search) {
            result = result.filter(p =>
                `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter)
        }

        if (positionFilter !== 'all') {
            result = result.filter(p => p.position === positionFilter)
        }

        setFilteredPlayers(result)
    }, [search, statusFilter, positionFilter, players])

    const getHouseName = (houseId) => {
        const house = demoData.houses.find(h => h.id === houseId)
        return house?.name || 'Unassigned'
    }

    const openPlayerModal = (player = null) => {
        setSelectedPlayer(player)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedPlayer(null)
    }

    const handleSavePlayer = (e) => {
        e.preventDefault()
        const form = e.target
        const newPlayer = {
            id: selectedPlayer?.id || `p${Date.now()}`,
            first_name: form.firstName.value,
            last_name: form.lastName.value,
            position: form.position.value,
            nationality: form.nationality.value,
            age: parseInt(form.age.value),
            house_id: form.house.value,
            status: form.status.value,
            points: selectedPlayer?.points || 0
        }

        if (selectedPlayer) {
            setPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? newPlayer : p))
        } else {
            setPlayers(prev => [...prev, newPlayer])
        }
        closeModal()
    }

    const handleDeletePlayer = (playerId) => {
        if (confirm('Are you sure you want to remove this player?')) {
            setPlayers(prev => prev.filter(p => p.id !== playerId))
        }
    }

    const stats = {
        total: players.length,
        active: players.filter(p => p.status === 'active').length,
        training: players.filter(p => p.status === 'training').length,
        rest: players.filter(p => p.status === 'rest').length,
    }

    return (
        <div className="players-page">
            {/* Stats Overview */}
            <div className="player-stats-row">
                <div className="player-stat-card">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total Players</span>
                </div>
                <div className="player-stat-card">
                    <span className="stat-number stat-active">{stats.active}</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="player-stat-card">
                    <span className="stat-number stat-training">{stats.training}</span>
                    <span className="stat-label">Training</span>
                </div>
                <div className="player-stat-card">
                    <span className="stat-number stat-rest">{stats.rest}</span>
                    <span className="stat-label">Rest</span>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card-static filters-card">
                <div className="filters-row">
                    <div className="input-group filter-input">
                        <input
                            type="text"
                            className="input"
                            placeholder="🔍 Search players..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-select-group">
                        <select
                            className="input filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="training">Training</option>
                            <option value="rest">Rest</option>
                            <option value="injured">Injured</option>
                        </select>
                        <select
                            className="input filter-select"
                            value={positionFilter}
                            onChange={(e) => setPositionFilter(e.target.value)}
                        >
                            <option value="all">All Positions</option>
                            <option value="STRIKER">Striker</option>
                            <option value="WINGER">Winger</option>
                            <option value="MIDFIELDER">Midfielder</option>
                            <option value="DEFENDER">Defender</option>
                            <option value="GOALKEEPER">Goalkeeper</option>
                        </select>
                    </div>
                    {isStaff && (
                        <button className="btn btn-primary" onClick={() => openPlayerModal()}>
                            + Add Player
                        </button>
                    )}
                </div>
            </div>

            {/* Players Grid */}
            <div className="players-grid">
                {filteredPlayers.map(player => (
                    <div key={player.id} className="glass-card player-card">
                        <div className="player-card-header">
                            <div className="avatar player-avatar">
                                {player.first_name[0]}{player.last_name[0]}
                            </div>
                            <span className={`badge status-${player.status}`}>
                                {player.status}
                            </span>
                        </div>
                        <div className="player-card-body">
                            <h3 className="player-name">{player.first_name} {player.last_name}</h3>
                            <p className="player-position">{player.position}</p>
                            <div className="player-meta">
                                <span>🏠 {getHouseName(player.house_id)}</span>
                                <span>🎂 {player.age} yrs</span>
                                <span>🌍 {player.nationality}</span>
                            </div>
                            <div className="player-points">
                                <span className="points-icon">⭐</span>
                                <span className="points-value">{player.points}</span>
                                <span className="points-text">points</span>
                            </div>
                        </div>
                        {isStaff && (
                            <div className="player-card-actions">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => openPlayerModal(player)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--color-error)' }}
                                    onClick={() => handleDeletePlayer(player.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredPlayers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">⚽</div>
                    <h3 className="empty-state-title">No players found</h3>
                    <p className="empty-state-description">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {selectedPlayer ? 'Edit Player' : 'Add New Player'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSavePlayer}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">First Name</label>
                                        <input
                                            name="firstName"
                                            className="input"
                                            defaultValue={selectedPlayer?.first_name}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Last Name</label>
                                        <input
                                            name="lastName"
                                            className="input"
                                            defaultValue={selectedPlayer?.last_name}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Position</label>
                                        <select name="position" className="input" defaultValue={selectedPlayer?.position || 'MIDFIELDER'}>
                                            <option value="STRIKER">Striker</option>
                                            <option value="WINGER">Winger</option>
                                            <option value="MIDFIELDER">Midfielder</option>
                                            <option value="DEFENDER">Defender</option>
                                            <option value="GOALKEEPER">Goalkeeper</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Age</label>
                                        <input
                                            name="age"
                                            type="number"
                                            className="input"
                                            min="16"
                                            max="35"
                                            defaultValue={selectedPlayer?.age || 18}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Nationality</label>
                                        <input
                                            name="nationality"
                                            className="input"
                                            defaultValue={selectedPlayer?.nationality || 'Germany'}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">House</label>
                                        <select name="house" className="input" defaultValue={selectedPlayer?.house_id || 'h1'}>
                                            {demoData.houses.map(house => (
                                                <option key={house.id} value={house.id}>{house.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select name="status" className="input" defaultValue={selectedPlayer?.status || 'active'}>
                                            <option value="active">Active</option>
                                            <option value="training">Training</option>
                                            <option value="rest">Rest</option>
                                            <option value="injured">Injured</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedPlayer ? 'Save Changes' : 'Add Player'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
