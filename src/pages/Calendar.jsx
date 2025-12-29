import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Calendar.css'

export default function Calendar() {
    const { isStaff } = useAuth()
    const [events, setEvents] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [showModal, setShowModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'

    useEffect(() => {
        setEvents(demoData.events)
    }, [])

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
            training: 'success',
            meeting: 'info',
            assessment: 'warning',
            match: 'error',
            social: 'primary'
        }
        return colors[type] || 'info'
    }

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

    // Sort events by date
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.date + 'T' + a.start_time) - new Date(b.date + 'T' + b.start_time)
    )

    // Group events by date
    const groupedEvents = sortedEvents.reduce((acc, event) => {
        const dateKey = event.date
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(event)
        return acc
    }, {})

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (dateStr === today.toISOString().split('T')[0]) return 'Today'
        if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }

    return (
        <div className="calendar-page">
            {/* Header */}
            <div className="calendar-header">
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        📋 List
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        📅 Calendar
                    </button>
                </div>
                {isStaff && (
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        + Add Event
                    </button>
                )}
            </div>

            {/* Event Stats */}
            <div className="event-stats">
                <div className="glass-card-static event-stat">
                    <span className="event-stat-icon">📅</span>
                    <span className="event-stat-value">{events.length}</span>
                    <span className="event-stat-label">Total Events</span>
                </div>
                <div className="glass-card-static event-stat">
                    <span className="event-stat-icon">⚽</span>
                    <span className="event-stat-value">{events.filter(e => e.type === 'training').length}</span>
                    <span className="event-stat-label">Training</span>
                </div>
                <div className="glass-card-static event-stat">
                    <span className="event-stat-icon">👥</span>
                    <span className="event-stat-value">{events.filter(e => e.type === 'meeting').length}</span>
                    <span className="event-stat-label">Meetings</span>
                </div>
                <div className="glass-card-static event-stat">
                    <span className="event-stat-icon">📊</span>
                    <span className="event-stat-value">{events.filter(e => e.type === 'assessment').length}</span>
                    <span className="event-stat-label">Assessments</span>
                </div>
            </div>

            {/* Events List */}
            <div className="events-container">
                {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                    <div key={date} className="event-day-group">
                        <h3 className="event-day-label">{formatDate(date)}</h3>
                        <div className="events-list">
                            {dateEvents.map(event => (
                                <div key={event.id} className={`glass-card event-card type-${event.type}`}>
                                    <div className="event-time">
                                        <span className="time-start">{event.start_time}</span>
                                        <span className="time-divider">-</span>
                                        <span className="time-end">{event.end_time}</span>
                                    </div>
                                    <div className="event-content">
                                        <div className="event-type-badge">
                                            <span className={`badge badge-${getEventTypeColor(event.type)}`}>
                                                {getEventTypeIcon(event.type)} {event.type}
                                            </span>
                                        </div>
                                        <h4 className="event-title">{event.title}</h4>
                                        <p className="event-location">📍 {event.location}</p>
                                    </div>
                                    {isStaff && (
                                        <div className="event-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => openModal(event)}>
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--color-error)' }}
                                                onClick={() => handleDeleteEvent(event.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {events.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3 className="empty-state-title">No events scheduled</h3>
                    <p className="empty-state-description">
                        Create your first event to get started
                    </p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
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
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Event Type</label>
                                    <select name="type" className="input" defaultValue={selectedEvent?.type || 'training'}>
                                        <option value="training">Training</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="assessment">Assessment</option>
                                        <option value="match">Match</option>
                                        <option value="social">Social Event</option>
                                    </select>
                                </div>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            name="date"
                                            type="date"
                                            className="input"
                                            defaultValue={selectedEvent?.date}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Location</label>
                                        <input
                                            name="location"
                                            className="input"
                                            defaultValue={selectedEvent?.location}
                                        />
                                    </div>
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
