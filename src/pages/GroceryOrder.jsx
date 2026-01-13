import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    getGroceryItems,
    createGroceryOrder,
    getDeliveryDates,
    getGroceryOrders,
    GROCERY_BUDGET
} from '../lib/data-service'
import { ShoppingCart, Home, Salad, Beef, Milk, Wheat, CupSoda, Flame, Snowflake } from 'lucide-react'
import './GroceryOrder.css'

const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: 'cart' },
    { id: 'household', label: 'Household', icon: 'home' },
    { id: 'produce', label: 'Produce', icon: 'salad' },
    { id: 'meat', label: 'Meat & Eggs', icon: 'beef' },
    { id: 'dairy', label: 'Dairy', icon: 'milk' },
    { id: 'carbs', label: 'Carbs', icon: 'wheat' },
    { id: 'drinks', label: 'Drinks', icon: 'cup' },
    { id: 'spices', label: 'Spices', icon: 'flame' },
    { id: 'frozen', label: 'Frozen', icon: 'snowflake' }
]

const getCategoryIcon = (iconName) => {
    const iconProps = { size: 16 }
    switch (iconName) {
        case 'cart': return <ShoppingCart {...iconProps} />
        case 'home': return <Home {...iconProps} />
        case 'salad': return <Salad {...iconProps} />
        case 'beef': return <Beef {...iconProps} />
        case 'milk': return <Milk {...iconProps} />
        case 'wheat': return <Wheat {...iconProps} />
        case 'cup': return <CupSoda {...iconProps} />
        case 'flame': return <Flame {...iconProps} />
        case 'snowflake': return <Snowflake {...iconProps} />
        default: return <ShoppingCart {...iconProps} />
    }
}

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
    const [favorites, setFavorites] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const playerId = profile?.player_id || profile?.id
            const [itemsData, dates, pastOrders] = await Promise.all([
                getGroceryItems(),
                Promise.resolve(getDeliveryDates()),
                playerId ? getGroceryOrders(playerId) : Promise.resolve([])
            ])
            setItems(itemsData)
            setDeliveryDates(dates)

            // Analyze last 5 orders for frequently ordered items
            if (pastOrders.length > 0 && itemsData.length > 0) {
                const itemCounts = {}
                const recentOrders = pastOrders.slice(0, 5)
                recentOrders.forEach(order => {
                    order.items?.forEach(item => {
                        const itemId = item.grocery_item_id || item.itemId
                        itemCounts[itemId] = (itemCounts[itemId] || 0) + item.quantity
                    })
                })

                // Get top 6 most ordered items
                const topItemIds = Object.entries(itemCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([id]) => id)

                const favoriteItems = topItemIds
                    .map(id => itemsData.find(i => i.id === id || i.id === parseInt(id)))
                    .filter(Boolean)

                setFavorites(favoriteItems)
            }

            // Validate and clean cart - remove items that don't exist in current grocery items
            // This handles switching between demo mode and real data
            const savedCart = localStorage.getItem('grocery_cart')
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart)
                const validItemIds = new Set(itemsData.map(i => i.id))
                const validCart = parsedCart.filter(cartItem => validItemIds.has(cartItem.itemId))

                // If cart was cleaned (had invalid items), update localStorage
                if (validCart.length !== parsedCart.length) {
                    localStorage.setItem('grocery_cart', JSON.stringify(validCart))
                    console.log(`Cleaned cart: removed ${parsedCart.length - validCart.length} invalid items`)
                }
                setCart(validCart)
            } else if (pastOrders.length > 0 && itemsData.length > 0) {
                // Auto-fill cart with last order items if cart is empty
                const lastOrder = pastOrders[0]
                if (lastOrder.items && lastOrder.items.length > 0) {
                    const validItemIds = new Set(itemsData.map(i => i.id))
                    const autoFilledCart = lastOrder.items
                        .filter(orderItem => {
                            const itemId = orderItem.grocery_item_id || orderItem.itemId
                            return validItemIds.has(itemId) || validItemIds.has(parseInt(itemId))
                        })
                        .map(orderItem => {
                            const itemId = orderItem.grocery_item_id || orderItem.itemId
                            const groceryItem = itemsData.find(i => i.id === itemId || i.id === parseInt(itemId))
                            return {
                                itemId: groceryItem.id,
                                name: groceryItem.name,
                                price: groceryItem.price,
                                category: groceryItem.category,
                                quantity: orderItem.quantity
                            }
                        })

                    if (autoFilledCart.length > 0) {
                        setCart(autoFilledCart)
                        localStorage.setItem('grocery_cart', JSON.stringify(autoFilledCart))
                        console.log(`Auto-filled cart with ${autoFilledCart.length} items from last order`)
                    }
                }
            }

            // Auto-select first valid delivery date (always select if not already chosen)
            const savedDate = localStorage.getItem('grocery_delivery_date')
            const firstValid = dates.find(d => !d.expired)
            if (savedDate && dates.find(d => d.date === savedDate && !d.expired)) {
                setDeliveryDate(savedDate)
            } else if (firstValid) {
                setDeliveryDate(firstValid.date)
                localStorage.setItem('grocery_delivery_date', firstValid.date)
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
        if (!profile?.player_id) {
            showMessage('Your account is not linked to a player profile. Contact staff for help.', 'error')
            return
        }

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
                playerId: profile?.player_id,
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
                        <span className="category-chip__icon">{getCategoryIcon(cat.icon)}</span>
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

                    {/* Favorites Section */}
                    {favorites.length > 0 && selectedCategory === 'all' && !searchTerm && (
                        <div className="grocery-favorites">
                            <h3 className="grocery-favorites__title">Your Favorites</h3>
                            <div className="grocery-favorites__grid">
                                {favorites.map(item => {
                                    const quantity = getItemQuantity(item.id)
                                    const isHousehold = item.category === 'household'
                                    return (
                                        <div
                                            key={`fav-${item.id}`}
                                            className={`grocery-item grocery-item--favorite ${quantity > 0 ? 'grocery-item--in-cart' : ''}`}
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
                                })}
                            </div>
                        </div>
                    )}

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
