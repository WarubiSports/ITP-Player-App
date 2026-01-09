import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    getGroceryOrders,
    getGroceryOrderById,
    getGroceryItems
} from '../lib/data-service'
import './OrderHistory.css'

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    approved: { label: 'Approved', color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
    delivered: { label: 'Delivered', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
}

export default function OrderHistory() {
    const { profile } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [orderDetails, setOrderDetails] = useState({})
    const [message, setMessage] = useState(null)

    useEffect(() => {
        if (profile?.player_id || profile?.id) {
            loadOrders()
        }
    }, [profile?.player_id, profile?.id])

    const loadOrders = async () => {
        try {
            const data = await getGroceryOrders(profile?.player_id || profile?.id)
            setOrders(data)
        } catch (error) {
            console.error('Failed to load orders:', error)
            showMessage('Failed to load orders', 'error')
        } finally {
            setLoading(false)
        }
    }

    const showMessage = (text, type) => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 5000)
    }

    const toggleOrderDetails = async (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null)
            return
        }

        setExpandedOrder(orderId)

        if (!orderDetails[orderId]) {
            try {
                const details = await getGroceryOrderById(orderId)
                setOrderDetails(prev => ({ ...prev, [orderId]: details }))
            } catch (error) {
                console.error('Failed to load order details:', error)
            }
        }
    }

    const reorderItems = async (orderId) => {
        try {
            const details = orderDetails[orderId] || await getGroceryOrderById(orderId)
            const allItems = await getGroceryItems()

            // Build cart from order items
            const cart = details.items.map(orderItem => {
                const currentItem = allItems.find(item => item.name === orderItem.name)
                if (currentItem) {
                    return {
                        itemId: currentItem.id,
                        name: currentItem.name,
                        price: currentItem.price,
                        category: currentItem.category,
                        quantity: orderItem.quantity
                    }
                }
                return null
            }).filter(Boolean)

            // Save to localStorage
            localStorage.setItem('grocery_cart', JSON.stringify(cart))
            showMessage('Items added to cart! Redirecting...', 'success')

            setTimeout(() => {
                window.location.href = '/grocery'
            }, 1500)
        } catch (error) {
            console.error('Failed to reorder:', error)
            showMessage('Failed to reorder items', 'error')
        }
    }

    const formatDate = (dateStr) => {
        // Parse date string as local date (not UTC) to avoid timezone shifts
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatShortDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day).toLocaleDateString('en-GB')
    }

    if (loading) {
        return (
            <div className="order-history-page">
                <div className="order-history-loading">
                    <div className="loading-spinner" />
                    <p>Loading your orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="order-history-page">
            <header className="order-history-header">
                <div className="order-history-header__left">
                    <h1>Order History</h1>
                    <p>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
                </div>
                <div className="order-history-header__right">
                    <Link to="/grocery" className="new-order-btn">
                        + New Order
                    </Link>
                </div>
            </header>

            {message && (
                <div className={`order-history-message order-history-message--${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="orders-empty">
                        <span className="orders-empty__icon">🛒</span>
                        <h3>No Orders Yet</h3>
                        <p>You haven't placed any grocery orders yet.</p>
                        <Link to="/grocery" className="new-order-btn">
                            Place Your First Order
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                            const isExpanded = expandedOrder === order.id
                            const details = orderDetails[order.id]

                            return (
                                <div
                                    key={order.id}
                                    className={`order-card ${isExpanded ? 'order-card--expanded' : ''}`}
                                >
                                    <div className="order-card__header">
                                        <div className="order-card__info">
                                            <span className="order-card__submitted">
                                                Ordered: {formatShortDate(order.submitted_at)}
                                            </span>
                                            <span className="order-card__delivery">
                                                Delivery: {formatDate(order.delivery_date)}
                                            </span>
                                            <span
                                                className="order-card__status"
                                                style={{
                                                    background: status.bg,
                                                    color: status.color,
                                                    borderColor: status.color
                                                }}
                                            >
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="order-card__total">
                                            €{parseFloat(order.total_amount).toFixed(2)}
                                        </div>
                                    </div>

                                    {isExpanded && details && (
                                        <div className="order-card__details">
                                            <div className="order-items-grid">
                                                {details.items.map((item, idx) => (
                                                    <div key={idx} className="order-item">
                                                        <div className="order-item__info">
                                                            <span className="order-item__name">{item.name}</span>
                                                            <span className="order-item__qty">Qty: {item.quantity}</span>
                                                        </div>
                                                        <span className="order-item__price">
                                                            {item.category === 'household'
                                                                ? 'Free'
                                                                : `€${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}`
                                                            }
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="order-card__actions">
                                        <button
                                            className="order-action-btn order-action-btn--details"
                                            onClick={() => toggleOrderDetails(order.id)}
                                        >
                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                        </button>
                                        <button
                                            className="order-action-btn order-action-btn--reorder"
                                            onClick={() => reorderItems(order.id)}
                                        >
                                            Reorder This
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
