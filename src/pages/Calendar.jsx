import { useState, useEffect, useMemo } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Calendar.css'

export default function Calendar() {
    const { isStaff } = useAuth()
    const [events, setEvents] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showModal, setShowModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)

    useEffect(() => {
        setEvents(demoData.events)
    }, [])

    // Calendar utilities
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate)
        const firstDay = getFirstDayOfMonth(currentDate)
        const days = []

        // Previous month days
        const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                isPrevMonth: true,
                date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i)
            })
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                isPrevMonth: false,
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
            })
        }

        // Next month days
        const remainingDays = 42 - days.length // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                isPrevMonth: false,
                date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
            })
        }

        return days
    }

    const calendarDays = generateCalendarDays()

    // Event utilities
    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0]
        return events.filter(e => e.date === dateStr)
    }

    const getEventTypeIcon = (type) => {
        const icons = {
            training: '⚽',
            meeting: '👥',
            assessment: '📊',
            match: '🏟️',
            social: '🎉'
        }
        return icons[type] || '📅'
    }

    const getEventTypeColor = (type) => {
        const colors = {
            training: '#22C55E',
            meeting: '#3B82F6',
            assessment: '#F59E0B',
            match: '#EF4444',
            social: '#DC143C'
        }
        return colors[type] || '#3B82F6'
    }

    const isToday = (date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const isSelected = (date) => {
        return date.toDateString() === selectedDate.toDateString()
    }

    // Navigation
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentDate(today)
        setSelectedDate(today)
    }

    // Modal handlers
    const openModal = (event = null) => {
        setSelectedEvent(event)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedEvent(null)
    }

    const handleSaveEvent = (e) => {
        e.preventDefault()
        const form = e.target
        const newEvent = {
            id: selectedEvent?.id || `e${Date.now()}`,
            title: form.title.value,
            type: form.type.value,
            date: form.date.value,
            start_time: form.startTime.value,
            end_time: form.endTime.value,
            location: form.location.value
        }

        if (selectedEvent) {
            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? newEvent : e))
        } else {
            setEvents(prev => [...prev, newEvent])
        }
        closeModal()
    }

    const handleDeleteEvent = (eventId) => {
        if (confirm('Are you sure you want to delete this event?')) {
            setEvents(prev => prev.filter(e => e.id !== eventId))
        }
    }

    // Selected date events
    const selectedDateEvents = getEventsForDate(selectedDate).sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
    )

    const formatSelectedDate = () => {
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
        return selectedDate.toLocaleDateString('en-US', options)
    }

    return (
        <div className="calendar-page-ios">
            {/* Header */}
            <div className="ios-calendar-header">
                <div className="month-navigation">
                    <button className="nav-btn" onClick={prevMonth}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M12 16l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <h2 className="month-year">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button className="nav-btn" onClick={nextMonth}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 16l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div className="header-actions">
                    <button className="btn-today" onClick={goToToday}>Today</button>
                    {isStaff && (
                        <button className="btn-add-event" onClick={() => openModal()}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Add Event
                        </button>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="ios-calendar-container">
                <div className="calendar-grid-wrapper">
                    {/* Day names */}
                    <div className="calendar-weekdays">
                        {dayNames.map(day => (
                            <div key={day} className="weekday-label">{day}</div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="calendar-days">
                        {calendarDays.map((day, index) => {
                            const dayEvents = getEventsForDate(day.date)
                            const hasEvents = dayEvents.length > 0

                            return (
                                <button
                                    key={index}
                                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''} ${isSelected(day.date) ? 'selected' : ''}`}
                                    onClick={() => setSelectedDate(day.date)}
                                >
                                    <span className="day-number">{day.day}</span>
                                    {hasEvents && (
                                        <div className="event-indicators">
                                            {dayEvents.slice(0, 3).map((event, i) => (
                                                <span
                                                    key={i}
                                                    className="event-dot"
                                                    style={{ backgroundColor: getEventTypeColor(event.type) }}
                                                />
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span className="event-more">+{dayEvents.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Selected Date Events */}
                <div className="selected-date-section">
                    <h3 className="selected-date-title">{formatSelectedDate()}</h3>

                    {selectedDateEvents.length > 0 ? (
                        <div className="day-events-list">
                            {selectedDateEvents.map(event => (
                                <div key={event.id} className="ios-event-card" style={{ borderLeftColor: getEventTypeColor(event.type) }}>
                                    <div className="event-time-block">
                                        <span className="event-time">{event.start_time}</span>
                                        <span className="event-duration">
                                            {event.end_time}
                                        </span>
                                    </div>
                                    <div className="event-details">
                                        <div className="event-header-row">
                                            <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                                            <h4 className="event-name">{event.title}</h4>
                                        </div>
                                        <p className="event-location">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                                <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5c0 2.433 3.5 6.5 3.5 6.5s3.5-4.067 3.5-6.5C9.5 2.567 7.933 1 6 1zm0 4.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="currentColor"/>
                                            </svg>
                                            {event.location}
                                        </p>
                                    </div>
                                    {isStaff && (
                                        <div className="event-card-actions">
                                            <button className="icon-btn" onClick={() => openModal(event)} title="Edit">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                                </svg>
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDeleteEvent(event.id)} title="Delete">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4v9h8V4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-events-message">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M8 18h32M16 8v8M32 8v8" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <p>No events scheduled</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {selectedEvent ? 'Edit Event' : 'Add New Event'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSaveEvent}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Event Title</label>
                                    <input
                                        name="title"
                                        className="input"
                                        defaultValue={selectedEvent?.title}
                                        placeholder="Training Session"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Event Type</label>
                                    <select name="type" className="input" defaultValue={selectedEvent?.type || 'training'}>
                                        <option value="training">⚽ Training</option>
                                        <option value="meeting">👥 Meeting</option>
                                        <option value="assessment">📊 Assessment</option>
                                        <option value="match">🏟️ Match</option>
                                        <option value="social">🎉 Social Event</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            name="date"
                                            type="date"
                                            className="input"
                                            defaultValue={selectedEvent?.date || selectedDate.toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Location</label>
                                        <input
                                            name="location"
                                            className="input"
                                            defaultValue={selectedEvent?.location}
                                            placeholder="Training Ground A"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Start Time</label>
                                        <input
                                            name="startTime"
                                            type="time"
                                            className="input"
                                            defaultValue={selectedEvent?.start_time || '09:00'}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">End Time</label>
                                        <input
                                            name="endTime"
                                            type="time"
                                            className="input"
                                            defaultValue={selectedEvent?.end_time || '10:00'}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {selectedEvent ? 'Save Changes' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
