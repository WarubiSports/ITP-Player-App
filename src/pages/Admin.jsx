import { useState, useEffect, useMemo } from 'react'
import { demoData } from '../lib/supabase'
import {
    getAdminGroceryOrders,
    updateGroceryOrder,
    getHouses,
    getDeliveryDates,
    deletePlayer,
    deleteUser
} from '../lib/data-service'
import './Admin.css'

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    approved: { label: 'Approved', color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
    delivered: { label: 'Delivered', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
}

export default function Admin() {
    const [users, setUsers] = useState([])
    const [applications, setApplications] = useState([])
    const [activeTab, setActiveTab] = useState('users')
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Grocery orders state
    const [groceryOrders, setGroceryOrders] = useState([])
    const [houses, setHouses] = useState([])
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useState('')
    const [deliveryDates, setDeliveryDates] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [expandedHouse, setExpandedHouse] = useState(null)
    const [groceryViewMode, setGroceryViewMode] = useState('consolidated') // 'consolidated' | 'by-house'

    useEffect(() => {
        // Combine users and players for user management
        const allUsers = [
            ...demoData.users.map(u => ({ ...u, type: 'user' })),
            ...demoData.players.map(p => ({
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                role: 'player',
                status: p.status,
                type: 'player'
            }))
        ]
        setUsers(allUsers)

        // Demo applications
        setApplications([
            { id: 'app1', name: 'Dennis Huseinbasic', email: 'dennis@example.com', type: 'player', position: 'MIDFIELDER', age: 20, status: 'pending', date: '2024-12-26' },
            { id: 'app2', name: 'Sarah Mueller', email: 'sarah@example.com', type: 'staff', department: 'Coaching', status: 'pending', date: '2024-12-27' },
        ])

        // Load grocery data
        loadGroceryData()
    }, [])

    const loadGroceryData = async () => {
        setLoadingOrders(true)
        try {
            const [ordersData, housesData] = await Promise.all([
                getAdminGroceryOrders(),
                getHouses()
            ])
            setGroceryOrders(ordersData)
            setHouses(housesData)

            // Get available delivery dates (past and upcoming)
            const dates = getDeliveryDates()
            // Also get unique delivery dates from existing orders
            const orderDates = [...new Set(ordersData.map(o => o.delivery_date))].sort()
            const allDates = [...new Set([...orderDates, ...dates.map(d => d.date)])].sort()
            setDeliveryDates(allDates)

            // Default to the first date with pending orders, or first available date
            const pendingDate = ordersData.find(o => o.status === 'pending')?.delivery_date
            setSelectedDeliveryDate(pendingDate || allDates[0] || '')
        } catch (error) {
            console.error('Failed to load grocery data:', error)
        } finally {
            setLoadingOrders(false)
        }
    }

    // Group orders by house for the selected delivery date
    const ordersByHouse = useMemo(() => {
        if (!selectedDeliveryDate) return {}

        const dateOrders = groceryOrders.filter(o => o.delivery_date === selectedDeliveryDate)
        const grouped = {}

        // Initialize with all houses
        houses.forEach(h => {
            grouped[h.id] = {
                house: h,
                orders: [],
                aggregatedItems: {},
                totalAmount: 0,
                pendingCount: 0
            }
        })

        // Add "Unassigned" group
        grouped['unassigned'] = {
            house: { id: 'unassigned', name: 'Unassigned' },
            orders: [],
            aggregatedItems: {},
            totalAmount: 0,
            pendingCount: 0
        }

        // Group orders
        dateOrders.forEach(order => {
            const houseId = order.house_id || 'unassigned'
            if (!grouped[houseId]) return

            grouped[houseId].orders.push(order)
            grouped[houseId].totalAmount += parseFloat(order.total_amount) || 0
            if (order.status === 'pending') grouped[houseId].pendingCount++

            // Aggregate items
            order.items?.forEach(item => {
                const key = item.name
                if (!grouped[houseId].aggregatedItems[key]) {
                    grouped[houseId].aggregatedItems[key] = {
                        name: item.name,
                        category: item.category,
                        quantity: 0,
                        price: item.price_at_order
                    }
                }
                grouped[houseId].aggregatedItems[key].quantity += item.quantity
            })
        })

        // Remove empty houses and convert aggregatedItems to array
        const result = {}
        Object.entries(grouped).forEach(([id, data]) => {
            if (data.orders.length > 0) {
                result[id] = {
                    ...data,
                    aggregatedItems: Object.values(data.aggregatedItems).sort((a, b) =>
                        a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
                    )
                }
            }
        })

        return result
    }, [groceryOrders, houses, selectedDeliveryDate])

    // Consolidated view: All items across ALL houses for a delivery date
    const consolidatedSummary = useMemo(() => {
        if (!selectedDeliveryDate) return null

        const dateOrders = groceryOrders.filter(o => o.delivery_date === selectedDeliveryDate)
        if (dateOrders.length === 0) return null

        const allItems = {}
        let totalOrders = 0
        let totalAmount = 0
        let pendingCount = 0

        dateOrders.forEach(order => {
            totalOrders++
            totalAmount += parseFloat(order.total_amount) || 0
            if (order.status === 'pending') pendingCount++

            order.items?.forEach(item => {
                const key = item.name
                if (!allItems[key]) {
                    allItems[key] = {
                        name: item.name,
                        category: item.category,
                        quantity: 0
                    }
                }
                allItems[key].quantity += item.quantity
            })
        })

        // Group items by category
        const itemsByCategory = {}
        Object.values(allItems).forEach(item => {
            if (!itemsByCategory[item.category]) {
                itemsByCategory[item.category] = []
            }
            itemsByCategory[item.category].push(item)
        })

        // Sort items within each category
        Object.keys(itemsByCategory).forEach(category => {
            itemsByCategory[category].sort((a, b) => a.name.localeCompare(b.name))
        })

        // Get unique houses with orders
        const housesWithOrders = [...new Set(dateOrders.map(o => o.house_name || 'Unassigned'))].filter(Boolean)

        return {
            totalOrders,
            totalAmount,
            pendingCount,
            itemsByCategory,
            housesWithOrders,
            totalItems: Object.values(allItems).reduce((sum, item) => sum + item.quantity, 0)
        }
    }, [groceryOrders, selectedDeliveryDate])

    const pendingOrdersCount = useMemo(() => {
        return groceryOrders.filter(o => o.status === 'pending').length
    }, [groceryOrders])

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await updateGroceryOrder(orderId, { status: newStatus })
            setGroceryOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ))
        } catch (error) {
            console.error('Failed to update order:', error)
        }
    }

    const handleApproveAll = async (houseId) => {
        const houseData = ordersByHouse[houseId]
        if (!houseData) return

        const pendingOrders = houseData.orders.filter(o => o.status === 'pending')
        for (const order of pendingOrders) {
            await handleUpdateOrderStatus(order.id, 'approved')
        }
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleApprove = (appId) => {
        setApplications(prev => prev.map(a =>
            a.id === appId ? { ...a, status: 'approved' } : a
        ))
    }

    const handleReject = (appId) => {
        setApplications(prev => prev.map(a =>
            a.id === appId ? { ...a, status: 'rejected' } : a
        ))
    }

    const openEditModal = (user) => {
        setSelectedUser(user)
        setShowEditModal(true)
    }

    const closeEditModal = () => {
        setShowEditModal(false)
        setSelectedUser(null)
    }

    const openDeleteModal = (user) => {
        setUserToDelete(user)
        setShowDeleteModal(true)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setUserToDelete(null)
    }

    const handleDeleteUser = async (e) => {
        console.log('handleDeleteUser called', { e, userToDelete })

        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!userToDelete) {
            console.error('No user selected for deletion')
            return
        }

        console.log('Deleting user:', userToDelete)
        setDeleteLoading(true)
        try {
            if (userToDelete.type === 'player') {
                await deletePlayer(userToDelete.id)
            } else {
                await deleteUser(userToDelete.id)
            }
            // Remove from local state
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
            closeDeleteModal()
        } catch (error) {
            console.error('Failed to delete user:', error)
            alert('Failed to delete user. Please try again.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleSaveUser = (e) => {
        e.preventDefault()
        const form = e.target

        const updatedUser = {
            ...selectedUser,
            first_name: form.firstName.value,
            last_name: form.lastName.value,
            email: form.email.value,
            role: form.role.value,
            status: form.status.value
        }

        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u))
        closeEditModal()
    }

    const stats = {
        totalUsers: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        staff: users.filter(u => u.role === 'staff').length,
        players: users.filter(u => u.role === 'player').length,
        pendingApps: applications.filter(a => a.status === 'pending').length
    }

    return (
        <div className="admin-page">
            {/* Stats */}
            <div className="admin-stats">
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{stats.totalUsers}</span>
                    <span className="stat-label">Total Users</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">👑</span>
                    <span className="stat-value">{stats.admins}</span>
                    <span className="stat-label">Admins</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">🏷️</span>
                    <span className="stat-value">{stats.staff}</span>
                    <span className="stat-label">Staff</span>
                </div>
                <div className="glass-card-static admin-stat">
                    <span className="stat-icon">⚽</span>
                    <span className="stat-value">{stats.players}</span>
                    <span className="stat-label">Players</span>
                </div>
                <div className="glass-card-static admin-stat pending">
                    <span className="stat-icon">📋</span>
                    <span className="stat-value">{stats.pendingApps}</span>
                    <span className="stat-label">Pending Apps</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Management
                </button>
                <button
                    className={`admin-tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    📋 Applications
                    {stats.pendingApps > 0 && <span className="tab-badge">{stats.pendingApps}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'grocery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('grocery')}
                >
                    🛒 Grocery Orders
                    {pendingOrdersCount > 0 && <span className="tab-badge">{pendingOrdersCount}</span>}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-card-static admin-section">
                    <div className="section-header">
                        <h3>User Directory</h3>
                    </div>
                    <div className="users-table">
                        <div className="table-header">
                            <span>Name</span>
                            <span>Role</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>
                        {users.map(user => (
                            <div key={user.id} className="table-row">
                                <div className="user-cell">
                                    <div className="avatar avatar-sm">
                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                    </div>
                                    <div className="user-info">
                                        <span className="user-name">{user.first_name} {user.last_name}</span>
                                        <span className="user-email">{user.email || `${user.first_name?.toLowerCase()}.${user.last_name?.toLowerCase()}@itp.com`}</span>
                                    </div>
                                </div>
                                <span className={`badge badge-${user.role === 'admin' ? 'error' : user.role === 'staff' ? 'info' : 'success'}`}>
                                    {user.role}
                                </span>
                                <span className={`badge status-${user.status || 'active'}`}>
                                    {user.status || 'active'}
                                </span>
                                <div className="action-buttons">
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => openDeleteModal(user)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
                <div className="glass-card-static admin-section">
                    <div className="section-header">
                        <h3>Pending Applications</h3>
                    </div>
                    <div className="applications-list">
                        {applications.map(app => (
                            <div key={app.id} className={`application-card ${app.status}`}>
                                <div className="app-header">
                                    <div className="app-info">
                                        <h4>{app.name}</h4>
                                        <span className="app-email">{app.email}</span>
                                    </div>
                                    <span className={`badge badge-${app.type === 'player' ? 'success' : 'info'}`}>
                                        {app.type}
                                    </span>
                                </div>
                                <div className="app-details">
                                    {app.type === 'player' ? (
                                        <>
                                            <span>Position: {app.position}</span>
                                            <span>Age: {app.age}</span>
                                        </>
                                    ) : (
                                        <span>Department: {app.department}</span>
                                    )}
                                    <span>Applied: {new Date(app.date).toLocaleDateString()}</span>
                                </div>
                                {app.status === 'pending' && (
                                    <div className="app-actions">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleApprove(app.id)}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleReject(app.id)}
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                )}
                                {app.status !== 'pending' && (
                                    <div className={`app-status-banner ${app.status}`}>
                                        {app.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                    </div>
                                )}
                            </div>
                        ))}
                        {applications.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📋</div>
                                <h3 className="empty-state-title">No applications</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Grocery Orders Tab */}
            {activeTab === 'grocery' && (
                <div className="admin-grocery-section">
                    <div className="grocery-admin-header">
                        <div className="grocery-date-selector">
                            <label>Delivery Date:</label>
                            <select
                                value={selectedDeliveryDate}
                                onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                                className="input"
                            >
                                {deliveryDates.length === 0 && (
                                    <option value="">No orders yet</option>
                                )}
                                {deliveryDates.map(date => (
                                    <option key={date} value={date}>
                                        {formatDate(date)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grocery-view-toggle">
                            <button
                                className={`view-toggle-btn ${groceryViewMode === 'consolidated' ? 'active' : ''}`}
                                onClick={() => setGroceryViewMode('consolidated')}
                            >
                                Consolidated
                            </button>
                            <button
                                className={`view-toggle-btn ${groceryViewMode === 'by-house' ? 'active' : ''}`}
                                onClick={() => setGroceryViewMode('by-house')}
                            >
                                By House
                            </button>
                        </div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={loadGroceryData}
                            disabled={loadingOrders}
                        >
                            {loadingOrders ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {loadingOrders ? (
                        <div className="grocery-loading">
                            <div className="spinner"></div>
                            <p>Loading orders...</p>
                        </div>
                    ) : !consolidatedSummary ? (
                        <div className="glass-card-static admin-section">
                            <div className="empty-state">
                                <div className="empty-state-icon">🛒</div>
                                <h3 className="empty-state-title">No orders for this date</h3>
                                <p className="empty-state-text">Orders will appear here when players submit them.</p>
                            </div>
                        </div>
                    ) : groceryViewMode === 'consolidated' ? (
                        /* Consolidated View - All Houses Combined */
                        <div className="consolidated-view">
                            {/* Summary Stats */}
                            <div className="consolidated-stats glass-card-static">
                                <div className="consolidated-stat">
                                    <span className="stat-value">{consolidatedSummary.totalOrders}</span>
                                    <span className="stat-label">Total Orders</span>
                                </div>
                                <div className="consolidated-stat">
                                    <span className="stat-value">{consolidatedSummary.totalItems}</span>
                                    <span className="stat-label">Total Items</span>
                                </div>
                                <div className="consolidated-stat">
                                    <span className="stat-value">{consolidatedSummary.housesWithOrders.length}</span>
                                    <span className="stat-label">Houses</span>
                                </div>
                                <div className="consolidated-stat">
                                    <span className="stat-value">€{consolidatedSummary.totalAmount.toFixed(2)}</span>
                                    <span className="stat-label">Total Value</span>
                                </div>
                                {consolidatedSummary.pendingCount > 0 && (
                                    <div className="consolidated-stat pending">
                                        <span className="stat-value">{consolidatedSummary.pendingCount}</span>
                                        <span className="stat-label">Pending</span>
                                    </div>
                                )}
                            </div>

                            {/* Houses Summary */}
                            <div className="houses-summary glass-card-static">
                                <h3>Orders by House</h3>
                                <div className="houses-chips">
                                    {Object.entries(ordersByHouse).map(([houseId, data]) => (
                                        <div key={houseId} className="house-chip">
                                            <span className="house-chip-name">{data.house.name}</span>
                                            <span className="house-chip-count">{data.orders.length} orders</span>
                                            <span className="house-chip-amount">€{data.totalAmount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Master Shopping List by Category */}
                            <div className="master-shopping-list glass-card-static">
                                <h3>Complete Shopping List</h3>
                                <p className="shopping-list-subtitle">All items needed for {formatDate(selectedDeliveryDate)}</p>

                                <div className="category-sections">
                                    {Object.entries(consolidatedSummary.itemsByCategory)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([category, items]) => (
                                            <div key={category} className="category-section">
                                                <h4 className="category-header">
                                                    <span className="category-icon">
                                                        {category === 'household' ? '🏠' :
                                                         category === 'produce' ? '🥬' :
                                                         category === 'meat' ? '🥩' :
                                                         category === 'dairy' ? '🥛' :
                                                         category === 'carbs' ? '🍞' :
                                                         category === 'drinks' ? '🥤' :
                                                         category === 'spices' ? '🧂' :
                                                         category === 'frozen' ? '🧊' : '📦'}
                                                    </span>
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                    <span className="category-count">({items.length} items)</span>
                                                </h4>
                                                <div className="category-items">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="shopping-item">
                                                            <span className="shopping-item-qty">{item.quantity}x</span>
                                                            <span className="shopping-item-name">{item.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* By House View */
                        <div className="house-orders-grid">
                            {Object.entries(ordersByHouse).map(([houseId, data]) => {
                                const isExpanded = expandedHouse === houseId
                                return (
                                    <div key={houseId} className="house-order-card glass-card-static">
                                        <div
                                            className="house-order-header"
                                            onClick={() => setExpandedHouse(isExpanded ? null : houseId)}
                                        >
                                            <div className="house-order-info">
                                                <h3 className="house-name">{data.house.name}</h3>
                                                <div className="house-order-stats">
                                                    <span className="stat">{data.orders.length} orders</span>
                                                    <span className="stat-divider">•</span>
                                                    <span className="stat">€{data.totalAmount.toFixed(2)} total</span>
                                                    {data.pendingCount > 0 && (
                                                        <>
                                                            <span className="stat-divider">•</span>
                                                            <span className="stat pending">{data.pendingCount} pending</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="house-order-toggle">
                                                {isExpanded ? '▲' : '▼'}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="house-order-details">
                                                {/* Aggregated Shopping List */}
                                                <div className="aggregated-list">
                                                    <h4>Shopping List (Combined)</h4>
                                                    <div className="aggregated-items">
                                                        {data.aggregatedItems.map((item, idx) => (
                                                            <div key={idx} className="aggregated-item">
                                                                <span className="item-qty">{item.quantity}x</span>
                                                                <span className="item-name">{item.name}</span>
                                                                <span className="item-category">{item.category}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Individual Orders */}
                                                <div className="individual-orders">
                                                    <h4>Individual Orders</h4>
                                                    {data.orders.map(order => {
                                                        const status = STATUS_CONFIG[order.status]
                                                        return (
                                                            <div key={order.id} className="individual-order">
                                                                <div className="order-info">
                                                                    <span className="player-name">{order.player_name}</span>
                                                                    <span className="order-amount">
                                                                        €{parseFloat(order.total_amount).toFixed(2)}
                                                                    </span>
                                                                    <span
                                                                        className="order-status"
                                                                        style={{
                                                                            background: status.bg,
                                                                            color: status.color,
                                                                            borderColor: status.color
                                                                        }}
                                                                    >
                                                                        {status.label}
                                                                    </span>
                                                                </div>
                                                                <div className="order-actions">
                                                                    {order.status === 'pending' && (
                                                                        <button
                                                                            className="btn btn-success btn-xs"
                                                                            onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                    )}
                                                                    {order.status === 'approved' && (
                                                                        <button
                                                                            className="btn btn-primary btn-xs"
                                                                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                                                        >
                                                                            Mark Delivered
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {/* Bulk Actions */}
                                                {data.pendingCount > 0 && (
                                                    <div className="bulk-actions">
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleApproveAll(houseId)}
                                                        >
                                                            Approve All Pending ({data.pendingCount})
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="glass-card-static admin-section">
                    <div className="section-header">
                        <h3>System Settings</h3>
                    </div>
                    <div className="settings-content">
                        <div className="setting-group">
                            <h4>General</h4>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Program Name</span>
                                    <span className="setting-desc">Displayed throughout the application</span>
                                </div>
                                <input className="input setting-input" defaultValue="1.FC Köln ITP" />
                            </div>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Season</span>
                                    <span className="setting-desc">Current program season</span>
                                </div>
                                <input className="input setting-input" defaultValue="2024/25" />
                            </div>
                        </div>
                        <div className="setting-group">
                            <h4>Notifications</h4>
                            <div className="setting-item">
                                <div className="setting-info">
                                    <span className="setting-name">Email Notifications</span>
                                    <span className="setting-desc">Send email alerts for important events</span>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" defaultChecked />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <button className="btn btn-primary mt-4">Save Settings</button>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit User</h3>
                            <button className="modal-close" onClick={closeEditModal}>×</button>
                        </div>
                        <form onSubmit={handleSaveUser}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">First Name</label>
                                        <input
                                            name="firstName"
                                            className="input"
                                            defaultValue={selectedUser.first_name}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Last Name</label>
                                        <input
                                            name="lastName"
                                            className="input"
                                            defaultValue={selectedUser.last_name}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="input"
                                        defaultValue={selectedUser.email || `${selectedUser.first_name?.toLowerCase()}.${selectedUser.last_name?.toLowerCase()}@itp.com`}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Role</label>
                                        <select name="role" className="input" defaultValue={selectedUser.role}>
                                            <option value="player">Player</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Status</label>
                                        <select name="status" className="input" defaultValue={selectedUser.status || 'active'}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="injured">Injured</option>
                                            <option value="training">Training</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Delete User</h3>
                            <button className="modal-close" onClick={closeDeleteModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-warning">
                                <span className="delete-warning-icon">⚠️</span>
                                <p>Are you sure you want to delete <strong>{userToDelete.first_name} {userToDelete.last_name}</strong>?</p>
                                <p className="delete-warning-text">
                                    This action cannot be undone. All associated data including wellness logs, goals, achievements, and grocery orders will be permanently deleted.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDeleteUser}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
