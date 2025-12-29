import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import './Housing.css'

export default function Housing() {
    const [houses, setHouses] = useState([])
    const [selectedHouse, setSelectedHouse] = useState(null)

    useEffect(() => {
        const housesWithStats = demoData.houses.map(house => {
            const residents = demoData.players.filter(p => p.house_id === house.id)
            const houseChores = demoData.chores.filter(c => c.house_id === house.id)
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
        })
        setHouses(housesWithStats)
    }, [])

    const getRankIcon = (index) => ['🥇', '🥈', '🥉'][index] || ''

    return (
        <div className="housing-page">
            {/* Overview Stats */}
            <div className="housing-overview">
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">🏠</div>
                    <div className="overview-content">
                        <span className="overview-value">3</span>
                        <span className="overview-label">Active Houses</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">👥</div>
                    <div className="overview-content">
                        <span className="overview-value">{demoData.players.length}</span>
                        <span className="overview-label">Total Residents</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">✅</div>
                    <div className="overview-content">
                        <span className="overview-value">
                            {demoData.chores.filter(c => c.status === 'completed').length}
                        </span>
                        <span className="overview-label">Completed Chores</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon">🏆</div>
                    <div className="overview-content">
                        <span className="overview-value">{houses[0]?.name || '-'}</span>
                        <span className="overview-label">Leading House</span>
                    </div>
                </div>
            </div>

            {/* Houses Grid */}
            <div className="houses-grid">
                {houses.map((house, idx) => (
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

                        <div className="house-residents">
                            <h4>Residents</h4>
                            <div className="resident-avatars">
                                {house.residents.slice(0, 4).map(resident => (
                                    <div key={resident.id} className="avatar avatar-sm" title={`${resident.first_name} ${resident.last_name}`}>
                                        {resident.first_name[0]}{resident.last_name[0]}
                                    </div>
                                ))}
                                {house.residents.length > 4 && (
                                    <div className="avatar avatar-sm more-avatar">
                                        +{house.residents.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button className="btn btn-secondary w-full view-details-btn">
                            View Details →
                        </button>
                    </div>
                ))}
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
                                    <span className="detail-stat-label">Pending Chores</span>
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
                                            <span className={`badge status-${resident.status}`}>{resident.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>Recent Chores</h4>
                                <div className="chores-list-mini">
                                    {selectedHouse.chores.map(chore => (
                                        <div key={chore.id} className={`chore-item-mini ${chore.status}`}>
                                            <span className="chore-title">{chore.title}</span>
                                            <span className={`badge badge-${chore.status === 'completed' ? 'success' : 'warning'}`}>
                                                {chore.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
