import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    getGroceryItems,
    createGroceryOrder,
    getDeliveryDates,
    GROCERY_BUDGET
} from '../lib/data-service'
import './GroceryOrder.css'

const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: '🛒' },
    { id: 'household', label: 'Household', icon: '🏠' },
    { id: 'produce', label: 'Produce', icon: '🥬' },
    { id: 'meat', label: 'Meat & Eggs', icon: '🥩' },
    { id: 'dairy', label: 'Dairy', icon: '🥛' },
    { id: 'carbs', label: 'Carbs', icon: '🍞' },
    { id: 'drinks', label: 'Drinks', icon: '🥤' },
    { id: 'spices', label: 'Spices', icon: '🧂' },
    { id: 'frozen', label: 'Frozen', icon: '🧊' }
]

export default function GroceryOrder() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [cart, setCart] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')
    const [deliveryDates, setDeliveryDates] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        loadData()
        // Load cart from localStorage
        const savedCart = localStorage.getItem('grocery_cart')
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        }
        const savedDate = localStorage.getItem('grocery_delivery_date')
        if (savedDate) {
            setDeliveryDate(savedDate)
        }
    }, [])

    const loadData = async () => {
        try {
            const [itemsData, dates] = await Promise.all([
                getGroceryItems(),
                Promise.resolve(getDeliveryDates())
            ])
            setItems(itemsData)
            setDeliveryDates(dates)

            // Auto-select first valid delivery date
            const firstValid = dates.find(d => !d.expired)
            if (firstValid && !localStorage.getItem('grocery_delivery_date')) {
                setDeliveryDate(firstValid.date)
            }
        } catch (error) {
            console.error('Failed to load grocery items:', error)
            showMessage('Failed to load grocery items', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
            const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [items, selectedCategory, searchTerm])

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, cartItem) => {
            if (cartItem.category === 'household') return sum
            return sum + (cartItem.price * cartItem.quantity)
        }, 0)
    }, [cart])

    const cartCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0)
    }, [cart])

    const budgetRemaining = GROCERY_BUDGET - cartTotal
    const isOverBudget = cartTotal > GROCERY_BUDGET

    const saveCart = (newCart) => {
        setCart(newCart)
        localStorage.setItem('grocery_cart', JSON.stringify(newCart))
    }

    const addToCart = (item) => {
        const existing = cart.find(c => c.itemId === item.id)
        if (existing) {
            const updated = cart.map(c =>
                c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
            )
            saveCart(updated)
        } else {
            saveCart([...cart, {
                itemId: item.id,
                name: item.name,
                price: item.price,
                category: item.category,
                quantity: 1
            }])
        }
    }

    const removeFromCart = (itemId) => {
        const existing = cart.find(c => c.itemId === itemId)
        if (existing && existing.quantity > 1) {
            const updated = cart.map(c =>
                c.itemId === itemId ? { ...c, quantity: c.quantity - 1 } : c
            )
            saveCart(updated)
        } else {
            saveCart(cart.filter(c => c.itemId !== itemId))
        }
    }

    const getItemQuantity = (itemId) => {
        const cartItem = cart.find(c => c.itemId === itemId)
        return cartItem ? cartItem.quantity : 0
    }

    const clearCart = () => {
        if (window.confirm('Clear all items from your cart?')) {
            saveCart([])
        }
    }

    const handleDeliveryDateChange = (e) => {
        setDeliveryDate(e.target.value)
        localStorage.setItem('grocery_delivery_date', e.target.value)
    }

    const showMessage = (text, type) => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 5000)
    }

    const submitOrder = async () => {
        if (!deliveryDate) {
            showMessage('Please select a delivery date', 'error')
            return
        }

        if (cart.length === 0) {
            showMessage('Your cart is empty', 'error')
            return
        }

        if (isOverBudget) {
            showMessage(`Order total exceeds budget of €${GROCERY_BUDGET}`, 'error')
            return
        }

        setSubmitting(true)
        try {
            await createGroceryOrder({
                playerId: profile?.id,
                deliveryDate,
                items: cart.map(item => ({
                    itemId: item.itemId,
                    quantity: item.quantity
                }))
            })

            saveCart([])
            localStorage.removeItem('grocery_delivery_date')
            setDeliveryDate('')
            // Redirect to order history to see the submitted order
            navigate('/order-history')
        } catch (error) {
            showMessage(error.message || 'Failed to submit order', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="grocery-page">
                <div className="grocery-loading">
                    <div className="loading-spinner" />
                    <p>Loading grocery items...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grocery-page">
            <header className="grocery-header">
                <div className="grocery-header__left">
                    <h1>Grocery Order</h1>
                    <p>Personal Budget: €{GROCERY_BUDGET.toFixed(2)} per order (2x/week) - Main meals at canteen</p>
                </div>
                <div className="grocery-header__right">
                    <Link to="/order-history" className="history-link">
                        View Order History
                    </Link>
                </div>
            </header>

            {message && (
                <div className={`grocery-message grocery-message--${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="grocery-categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-chip ${selectedCategory === cat.id ? 'category-chip--active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        <span className="category-chip__icon">{cat.icon}</span>
                        <span className="category-chip__label">{cat.label}</span>
                    </button>
                ))}
            </div>

            <div className="grocery-layout">
                <div className="grocery-main">
                    <div className="grocery-search">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="grocery-search__input"
                        />
                    </div>

                    <div className="grocery-items">
                        {filteredItems.length === 0 ? (
                            <div className="grocery-empty">No items found</div>
                        ) : (
                            filteredItems.map(item => {
                                const quantity = getItemQuantity(item.id)
                                const isHousehold = item.category === 'household'
                                return (
                                    <div
                                        key={item.id}
                                        className={`grocery-item ${quantity > 0 ? 'grocery-item--in-cart' : ''}`}
                                    >
                                        <div className="grocery-item__info">
                                            <span className="grocery-item__name">{item.name}</span>
                                            <span className="grocery-item__category">{item.category}</span>
                                        </div>
                                        <div className="grocery-item__price">
                                            {isHousehold ? 'Free' : `€${item.price.toFixed(2)}`}
                                        </div>
                                        <div className="grocery-item__controls">
                                            <button
                                                className="qty-btn qty-btn--minus"
                                                onClick={() => removeFromCart(item.id)}
                                                disabled={quantity === 0}
                                            >
                                                -
                                            </button>
                                            <span className="qty-display">{quantity}</span>
                                            <button
                                                className="qty-btn qty-btn--plus"
                                                onClick={() => addToCart(item)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                <aside className="grocery-cart">
                    <div className="cart-header">
                        <h2>Your Cart</h2>
                        <span className="cart-count">{cartCount}</span>
                    </div>

                    <div className="cart-delivery">
                        <label>Delivery Date</label>
                        <select
                            value={deliveryDate}
                            onChange={handleDeliveryDateChange}
                            className="cart-delivery__select"
                        >
                            <option value="">Select delivery date</option>
                            {deliveryDates.map(d => (
                                <option key={d.date} value={d.date} disabled={d.expired}>
                                    {d.expired
                                        ? `${d.dayName}, ${d.formattedDate} - Deadline passed`
                                        : `${d.dayName}, ${d.formattedDate} - Order by ${d.deadlineText}`
                                    }
                                </option>
                            ))}
                        </select>
                        <small className="cart-delivery__info">
                            Deadlines: Mon 8AM for Tue, Thu 8AM for Fri. Delivery 6-8 PM.
                        </small>
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <div className="cart-empty">Your cart is empty</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.itemId} className="cart-item">
                                    <div className="cart-item__info">
                                        <span className="cart-item__name">{item.name}</span>
                                        <span className="cart-item__price">
                                            {item.category === 'household' ? 'Free' : `€${item.price.toFixed(2)} each`}
                                        </span>
                                    </div>
                                    <div className="cart-item__right">
                                        <span className="cart-item__qty">x{item.quantity}</span>
                                        <span className="cart-item__total">
                                            {item.category === 'household' ? 'Free' : `€${(item.price * item.quantity).toFixed(2)}`}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-budget">
                        <div className="cart-budget__row">
                            <span>Budget Limit:</span>
                            <span>€{GROCERY_BUDGET.toFixed(2)}</span>
                        </div>
                        <div className="cart-budget__total">
                            <span>Total:</span>
                            <span className={isOverBudget ? 'over-budget' : ''}>
                                €{cartTotal.toFixed(2)}
                            </span>
                        </div>
                        <div className={`cart-budget__remaining ${isOverBudget ? 'warning' : ''}`}>
                            {isOverBudget
                                ? `€${Math.abs(budgetRemaining).toFixed(2)} over budget!`
                                : `€${budgetRemaining.toFixed(2)} remaining`
                            }
                        </div>
                    </div>

                    <button
                        className="cart-submit"
                        onClick={submitOrder}
                        disabled={cart.length === 0 || !deliveryDate || isOverBudget || submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Order'}
                    </button>

                    {cart.length > 0 && (
                        <button className="cart-clear" onClick={clearCart}>
                            Clear Cart
                        </button>
                    )}
                </aside>
            </div>
        </div>
    )
}
