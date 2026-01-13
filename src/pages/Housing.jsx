import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
    getHouses,
    getPlayers,
    createChore,
    updateChore,
    submitChorePhoto,
    getChorePhoto,
    approveChore,
    rejectChore,
    getChoreTemplates,
    createChoreTemplate,
    deleteChoreTemplate,
    generateWeeklyChores
} from '../lib/data-service'
import { useRealtimeChores } from '../hooks/useRealtimeChores'
import { useRealtimeHousePoints } from '../hooks/useRealtimeHousePoints'
import ConnectionStatus from '../components/ui/ConnectionStatus'
import './Housing.css'

export default function Housing() {
    const { profile, isStaff } = useAuth()
    const [players, setPlayers] = useState([])
    const [playerData, setPlayerData] = useState(null)
    const [selectedHouse, setSelectedHouse] = useState(null)
    const [showChoreModal, setShowChoreModal] = useState(false)
    const [selectedChore, setSelectedChore] = useState(null)
    const [filter, setFilter] = useState('pending')
    const [playersLoading, setPlayersLoading] = useState(true)
    // Photo verification states
    const [showPhotoModal, setShowPhotoModal] = useState(false)
    const [photoChore, setPhotoChore] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef(null)
    // Staff approval states
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [approvalChore, setApprovalChore] = useState(null)
    const [approvalPhoto, setApprovalPhoto] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    // Template management states
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [templates, setTemplates] = useState([])
    const [generatingChores, setGeneratingChores] = useState(false)

    // Use realtime hooks
    const { houses, loading: housesLoading } = useRealtimeHousePoints({ showNotifications: false })
    const { chores, loading: choresLoading, highlightedChore, refreshChores } = useRealtimeChores({
        playerId: isStaff ? null : playerData?.id,
        showNotifications: true
    })

    const loading = housesLoading || choresLoading || playersLoading

    useEffect(() => {
        const loadPlayers = async () => {
            try {
                setPlayersLoading(true)
                const playersData = await getPlayers()
                setPlayers(playersData || [])
                const player = playersData?.find(p => p.id === profile?.id || p.user_id === profile?.id)
                setPlayerData(player)
            } catch (error) {
                console.error('Error loading players:', error)
            } finally {
                setPlayersLoading(false)
            }
        }
        loadPlayers()
    }, [profile?.id])

    useEffect(() => {
        if (isStaff) {
            loadTemplates()
        }
    }, [isStaff])

    const loadTemplates = async () => {
        try {
            const templatesData = await getChoreTemplates()
            setTemplates(templatesData || [])
        } catch (error) {
            console.error('Error loading templates:', error)
        }
    }

    const getHouseStats = (house) => {
        // Match by house.id OR house.name (handles both UUID and TEXT storage)
        const residents = players.filter(p =>
            p.house_id === house.id ||
            p.house_id === house.name ||
            house.id === p.house_id ||
            house.name === p.house_id
        )
        const houseChores = chores.filter(c =>
            c.house_id === house.id ||
            c.house_id === house.name
        )
        const completedChores = houseChores.filter(c => c.status === 'completed').length
        const pendingChores = houseChores.filter(c => c.status === 'pending').length

        return {
            ...house,
            residents,
            residentCount: residents.length,
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
        if (filter === 'approval') return chore.status === 'pending_approval'
        if (filter === 'completed') return chore.status === 'completed' || chore.status === 'approved'
        return true
    })

    const pendingApprovalCount = chores.filter(c => c.status === 'pending_approval').length

    const handleCompleteChore = async (chore) => {
        // If chore requires photo, show photo modal
        if (chore.requires_photo) {
            setPhotoChore(chore)
            setPhotoPreview(null)
            setShowPhotoModal(true)
            return
        }

        // Otherwise, complete directly (for non-photo chores)
        try {
            await updateChore(chore.id, {
                status: 'approved',
                completed_at: new Date().toISOString(),
                approved_at: new Date().toISOString()
            })
            await refreshChores()
        } catch (error) {
            console.error('Error completing chore:', error)
            alert('Failed to complete chore. Please try again.')
        }
    }

    // Photo upload handlers
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Photo must be less than 5MB')
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handlePhotoSubmit = async () => {
        if (!photoPreview || !photoChore) return

        setSubmitting(true)
        try {
            await submitChorePhoto(photoChore.id, photoPreview)
            await refreshChores()
            setShowPhotoModal(false)
            setPhotoChore(null)
            setPhotoPreview(null)
        } catch (error) {
            console.error('Error submitting photo:', error)
            alert('Failed to submit photo. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // Staff approval handlers
    const handleViewApproval = async (chore) => {
        setApprovalChore(chore)
        setRejectReason('')
        try {
            const photo = await getChorePhoto(chore.id)
            setApprovalPhoto(photo?.photo_data || null)
        } catch (error) {
            console.error('Error loading photo:', error)
        }
        setShowApprovalModal(true)
    }

    const handleApprove = async () => {
        if (!approvalChore) return
        setSubmitting(true)
        try {
            await approveChore(approvalChore.id)
            await refreshChores()
            setShowApprovalModal(false)
            setApprovalChore(null)
            setApprovalPhoto(null)
        } catch (error) {
            console.error('Error approving chore:', error)
            alert('Failed to approve. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!approvalChore) return
        setSubmitting(true)
        try {
            await rejectChore(approvalChore.id, rejectReason)
            await refreshChores()
            setShowApprovalModal(false)
            setApprovalChore(null)
            setApprovalPhoto(null)
            setRejectReason('')
        } catch (error) {
            console.error('Error rejecting chore:', error)
            alert('Failed to reject. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // Generate weekly chores for all houses
    const handleGenerateWeeklyChores = async () => {
        setGeneratingChores(true)
        try {
            for (const house of houses) {
                await generateWeeklyChores(house.id)
            }
            await refreshChores()
            alert('Weekly chores generated for all houses!')
        } catch (error) {
            console.error('Error generating chores:', error)
            alert('Failed to generate chores. Please try again.')
        } finally {
            setGeneratingChores(false)
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
            deadline: form.deadline.value || null
        }

        try {
            if (selectedChore) {
                await updateChore(selectedChore.id, choreData)
            } else {
                await createChore(choreData)
            }
            await refreshChores()
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

    const getRankIcon = (index) => ['1', '2', '3'][index] || ''

    const choreStats = {
        total: chores.length,
        pending: chores.filter(c => c.status === 'pending').length,
        pendingApproval: chores.filter(c => c.status === 'pending_approval').length,
        completed: chores.filter(c => c.status === 'completed' || c.status === 'approved').length,
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
                    <h1>House & Tasks</h1>
                    <p>House standings and your assigned chores</p>
                </div>
                <ConnectionStatus showLabel />
            </header>

            {/* House Leaderboard */}
            <div className="housing-overview">
                <div className="glass-card-static overview-card">
                    <div className="overview-icon-text">H</div>
                    <div className="overview-content">
                        <span className="overview-value">{houses.length}</span>
                        <span className="overview-label">Active Houses</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon-text">C</div>
                    <div className="overview-content">
                        <span className="overview-value">{choreStats.completed}</span>
                        <span className="overview-label">Completed Today</span>
                    </div>
                </div>
                <div className="glass-card-static overview-card">
                    <div className="overview-icon-text">P</div>
                    <div className="overview-content">
                        <span className="overview-value">{choreStats.pending}</span>
                        <span className="overview-label">Pending Tasks</span>
                    </div>
                </div>
                {!isStaff && (
                    <div className="glass-card-static overview-card highlight">
                        <div className="overview-icon-text">Y</div>
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
                        className={`glass-card house-card`}
                        onClick={() => setSelectedHouse(house)}
                    >
                        <div className="house-card-header">
                            <h3 className="house-name">{house.name}</h3>
                        </div>

                        <div className="house-stats">
                            <div className="house-stat">
                                <span className="stat-icon-mini">R</span>
                                <span className="stat-value">{house.residents.length}</span>
                                <span className="stat-label">Residents</span>
                            </div>
                            <div className="house-stat">
                                <span className="stat-icon-mini">%</span>
                                <span className="stat-value">{house.completionRate}%</span>
                                <span className="stat-label">Completion</span>
                            </div>
                            <div className="house-stat">
                                <span className="stat-icon-mini">P</span>
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
                        {isStaff ? 'All Tasks' : 'Your Tasks'}
                    </h2>
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pending
                        </button>
                        {isStaff && (
                            <button
                                className={`filter-tab ${filter === 'approval' ? 'active' : ''}`}
                                onClick={() => setFilter('approval')}
                            >
                                Approval {pendingApprovalCount > 0 && <span className="approval-badge">{pendingApprovalCount}</span>}
                            </button>
                        )}
                        <button
                            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            Completed
                        </button>
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                    </div>
                    {isStaff && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={handleGenerateWeeklyChores}
                                disabled={generatingChores}
                            >
                                {generatingChores ? 'Generating...' : 'Generate Weekly'}
                            </button>
                            <button className="btn btn-primary" onClick={() => { setSelectedChore(null); setShowChoreModal(true); }}>
                                + Create Task
                            </button>
                        </div>
                    )}
                </div>

                {/* Chores List */}
                <div className="chores-list">
                    {filteredChores.map(chore => (
                        <div key={chore.id} className={`glass-card chore-card ${chore.status} ${highlightedChore === chore.id ? 'highlight-flash' : ''}`}>
                            <div className="chore-header">
                                <div className="chore-title-section">
                                    <h3 className="chore-title">{chore.title}</h3>
                                    <div className="chore-badges">
                                        <span className={`badge badge-${getPriorityColor(chore.priority)}`}>
                                            {chore.priority}
                                        </span>
                                    </div>
                                </div>
                                <span className={`chore-status-badge ${chore.status}`}>
                                    {chore.status === 'completed' ? 'Done' : 'Pending'}
                                </span>
                            </div>

                            {chore.description && <p className="chore-description">{chore.description}</p>}

                            <div className="chore-meta">
                                <div className="meta-item">
                                    <span className="meta-label">House:</span>
                                    <span>{getHouseName(chore.house_id)}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Assigned:</span>
                                    <span>{getPlayerName(chore.assigned_to)}</span>
                                </div>
                                {chore.deadline && (
                                    <div className="meta-item">
                                        <span className="meta-label">Due:</span>
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
                                        <button className="btn btn-success btn-sm" onClick={() => handleCompleteChore(chore)}>
                                            {chore.requires_photo ? 'Complete with Photo' : 'Mark Complete'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {chore.status === 'pending_approval' && (
                                <div className="chore-actions">
                                    <span className="badge badge-warning">Awaiting Approval</span>
                                    {isStaff && (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleViewApproval(chore)}>
                                            Review Photo
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredChores.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">—</div>
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

            {/* Photo Upload Modal */}
            {showPhotoModal && photoChore && (
                <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Complete Task: {photoChore.title}</h3>
                            <button className="modal-close" onClick={() => setShowPhotoModal(false)}>x</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                Take a photo of the completed task for verification. Staff will review and approve.
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoSelect}
                                style={{ display: 'none' }}
                            />

                            {photoPreview ? (
                                <div className="photo-preview">
                                    <img src={photoPreview} alt="Task completion" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => { setPhotoPreview(null); fileInputRef.current?.click(); }}
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        Retake Photo
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ padding: '2rem', fontSize: '1.1rem' }}
                                >
                                    Take Photo
                                </button>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handlePhotoSubmit}
                                disabled={!photoPreview || submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Approval Modal */}
            {showApprovalModal && approvalChore && (
                <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Review: {approvalChore.title}</h3>
                            <button className="modal-close" onClick={() => setShowApprovalModal(false)}>x</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '1rem' }}>
                                <p><strong>Assigned to:</strong> {getPlayerName(approvalChore.assigned_to)}</p>
                                <p><strong>House:</strong> {getHouseName(approvalChore.house_id)}</p>
                            </div>

                            {approvalPhoto ? (
                                <div className="approval-photo">
                                    <h4 style={{ marginBottom: '0.5rem' }}>Submitted Photo:</h4>
                                    <img
                                        src={approvalPhoto}
                                        alt="Task completion proof"
                                        style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                            ) : (
                                <div className="no-photo-notice" style={{ padding: '2rem', textAlign: 'center', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                                    <p>No photo available</p>
                                </div>
                            )}

                            <div className="input-group" style={{ marginTop: '1rem' }}>
                                <label className="input-label">Rejection Reason (optional)</label>
                                <textarea
                                    className="input textarea"
                                    rows="2"
                                    placeholder="If rejecting, explain why..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-error"
                                onClick={handleReject}
                                disabled={submitting}
                            >
                                {submitting ? 'Rejecting...' : 'Reject'}
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleApprove}
                                disabled={submitting}
                            >
                                {submitting ? 'Approving...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
