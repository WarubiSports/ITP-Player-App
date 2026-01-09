import { useState, useEffect, useMemo, useCallback } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getCountryFlag, formatDateOfBirth } from '../utils/countryFlags'
import { createPerformanceTest, getPlayers, getHouses } from '../lib/data-service'
import './Players.css'

// Debounce hook for search optimization
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => clearTimeout(handler)
    }, [value, delay])

    return debouncedValue
}

export default function Players() {
    const { isStaff } = useAuth()
    const [players, setPlayers] = useState([])
    const [houses, setHouses] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [positionFilter, setPositionFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [selectedPlayer, setSelectedPlayer] = useState(null)
    const [showPerfTestModal, setShowPerfTestModal] = useState(false)
    const [perfTestPlayer, setPerfTestPlayer] = useState(null)

    // Debounce search input
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        const loadData = async () => {
            const [playersData, housesData] = await Promise.all([
                getPlayers(),
                getHouses()
            ])
            setPlayers(playersData || [])
            setHouses(housesData || [])
        }
        loadData()
    }, [])

    // Memoized filtered players with debounced search
    const filteredPlayers = useMemo(() => {
        let result = players

        if (debouncedSearch) {
            result = result.filter(p =>
                `${p.first_name} ${p.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase())
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter)
        }

        if (positionFilter !== 'all') {
            result = result.filter(p => p.position === positionFilter)
        }

        return result
    }, [debouncedSearch, statusFilter, positionFilter, players])

    // Memoized house lookup - house_id can be UUID or TEXT name
    const getHouseName = useCallback((houseId) => {
        if (!houseId) return 'Unassigned'
        // First check if houseId matches a house id
        const house = houses.find(h => h.id === houseId)
        if (house) return house.name
        // If not, houseId might be the house name itself (TEXT storage)
        const houseByName = houses.find(h => h.name === houseId)
        if (houseByName) return houseByName.name
        // Return houseId as-is if it looks like a house name
        if (typeof houseId === 'string' && houseId.includes('Widdersdorf')) return houseId
        return 'Unassigned'
    }, [houses])

    const openPlayerModal = useCallback((player = null) => {
        setSelectedPlayer(player)
        setShowModal(true)
    }, [])

    const closeModal = useCallback(() => {
        setShowModal(false)
        setSelectedPlayer(null)
    }, [])

    const handleSavePlayer = useCallback((e) => {
        e.preventDefault()
        const form = e.target
        const newPlayer = {
            id: selectedPlayer?.id || `p${Date.now()}`,
            first_name: form.firstName.value,
            last_name: form.lastName.value,
            position: form.position.value,
            nationality: form.nationality.value,
            date_of_birth: form.dateOfBirth.value,
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
    }, [selectedPlayer, closeModal])

    const handleDeletePlayer = useCallback((playerId) => {
        if (confirm('Are you sure you want to remove this player?')) {
            setPlayers(prev => prev.filter(p => p.id !== playerId))
        }
    }, [])

    const openPerfTestModal = useCallback((player) => {
        setPerfTestPlayer(player)
        setShowPerfTestModal(true)
    }, [])

    const closePerfTestModal = useCallback(() => {
        setShowPerfTestModal(false)
        setPerfTestPlayer(null)
    }, [])

    const handleSavePerfTest = useCallback(async (e) => {
        e.preventDefault()
        const form = e.target

        const testData = {
            player_id: perfTestPlayer.id,
            test_date: form.testDate.value,
            sprint_30m: form.sprint30m.value ? parseFloat(form.sprint30m.value) : null,
            sprint_20m: form.sprint20m.value ? parseFloat(form.sprint20m.value) : null,
            vertical_jump: form.verticalJump.value ? parseFloat(form.verticalJump.value) : null,
            agility_test: form.agilityTest.value ? parseFloat(form.agilityTest.value) : null,
            endurance_test: form.enduranceTest.value ? parseFloat(form.enduranceTest.value) : null,
            notes: form.notes.value || null
        }

        try {
            await createPerformanceTest(testData)
            alert('Performance test recorded successfully!')
            closePerfTestModal()
        } catch (error) {
            console.error('Error saving performance test:', error)
            alert('Failed to save performance test. Please try again.')
        }
    }, [perfTestPlayer, closePerfTestModal])

    // Memoized stats calculation
    const stats = useMemo(() => ({
        total: players.length,
        active: players.filter(p => p.status === 'active').length,
        training: players.filter(p => p.status === 'training').length,
        rest: players.filter(p => p.status === 'rest').length,
    }), [players])

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
                            {player.photo_url ? (
                                <img
                                    src={player.photo_url}
                                    alt={`${player.first_name} ${player.last_name}`}
                                    className="avatar player-avatar player-avatar-img"
                                />
                            ) : (
                                <div className="avatar player-avatar">
                                    {player.first_name[0]}{player.last_name[0]}
                                </div>
                            )}
                            <span className={`badge status-${player.status}`}>
                                {player.status}
                            </span>
                        </div>
                        <div className="player-card-body">
                            <h3 className="player-name">{player.first_name} {player.last_name}</h3>
                            <p className="player-position">{player.position}</p>
                            <div className="player-meta">
                                <span>🏠 {getHouseName(player.house_id)}</span>
                                <span>📅 {formatDateOfBirth(player.date_of_birth)}</span>
                                <span>{getCountryFlag(player.nationality)} {player.nationality}</span>
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
                                    className="btn btn-primary btn-sm"
                                    onClick={() => openPerfTestModal(player)}
                                >
                                    📊 Log Performance Test
                                </button>
                                <div className="player-card-actions-row">
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
                                        <label className="input-label">Date of Birth</label>
                                        <input
                                            name="dateOfBirth"
                                            type="date"
                                            className="input"
                                            defaultValue={selectedPlayer?.date_of_birth || '2005-01-01'}
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

            {/* Performance Test Modal */}
            {showPerfTestModal && perfTestPlayer && (
                <div className="modal-overlay" onClick={closePerfTestModal}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                📊 Log Performance Test - {perfTestPlayer.first_name} {perfTestPlayer.last_name}
                            </h3>
                            <button className="modal-close" onClick={closePerfTestModal}>×</button>
                        </div>
                        <form onSubmit={handleSavePerfTest}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Test Date *</label>
                                    <input
                                        name="testDate"
                                        type="date"
                                        className="input"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                                        Speed & Agility Tests
                                    </h4>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                        <div className="input-group">
                                            <label className="input-label">30m Sprint (seconds)</label>
                                            <input
                                                name="sprint30m"
                                                type="number"
                                                step="0.01"
                                                className="input"
                                                placeholder="e.g., 4.25"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">20m Sprint (seconds)</label>
                                            <input
                                                name="sprint20m"
                                                type="number"
                                                step="0.01"
                                                className="input"
                                                placeholder="e.g., 3.15"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Vertical Jump (cm)</label>
                                            <input
                                                name="verticalJump"
                                                type="number"
                                                step="0.1"
                                                className="input"
                                                placeholder="e.g., 55.5"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Agility Test (seconds)</label>
                                            <input
                                                name="agilityTest"
                                                type="number"
                                                step="0.01"
                                                className="input"
                                                placeholder="e.g., 15.30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                                        Endurance Test
                                    </h4>
                                    <div className="input-group">
                                        <label className="input-label">Endurance (minutes)</label>
                                        <input
                                            name="enduranceTest"
                                            type="number"
                                            step="0.1"
                                            className="input"
                                            placeholder="e.g., 12.5 (Cooper test)"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <div className="input-group">
                                        <label className="input-label">Notes</label>
                                        <textarea
                                            name="notes"
                                            className="input textarea"
                                            rows="3"
                                            placeholder="Additional observations, conditions, or comments..."
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: 'var(--space-4)',
                                    padding: 'var(--space-3)',
                                    background: 'var(--color-info-bg)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    💡 <strong>Tip:</strong> Fill in only the tests you performed. Empty fields will be skipped.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closePerfTestModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Performance Test
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
