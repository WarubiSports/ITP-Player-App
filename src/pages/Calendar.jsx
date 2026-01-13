import { useState, useEffect } from 'react'
import { getPlayers, createEvent, updateEvent, createEventAttendees } from '../lib/data-service'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeEvents } from '../hooks/useRealtimeEvents'
import { getLocalDate } from '../lib/date-utils'
import ConnectionStatus from '../components/ui/ConnectionStatus'
import { Activity, Dumbbell, Trophy, Globe, Laptop, Users, BarChart3, Heart, PartyPopper, Calendar as CalendarIcon } from 'lucide-react'
import './Calendar.css'

// Get today's date string in CET timezone (YYYY-MM-DD)
const getTodayDateStr = () => getLocalDate('Europe/Berlin')

// Create a Date object from YYYY-MM-DD string (for calendar display only)
const dateFromString = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

// Format a Date object to YYYY-MM-DD string (without timezone conversion)
const formatDateStr = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Format time for display - handles both ISO strings and simple time strings
const formatEventTime = (timeStr) => {
    if (!timeStr) return '--:--'
    // If it's a simple time string like "09:00", return as-is
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr
    // If it's an ISO string, extract and format the time
    try {
        const date = new Date(timeStr)
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return timeStr
    }
}

export default function Calendar() {
    const { isStaff, profile } = useAuth()
    const [players, setPlayers] = useState([])
    const [currentPlayerId, setCurrentPlayerId] = useState(null)
    const [currentDate, setCurrentDate] = useState(dateFromString(getTodayDateStr()))
    const [selectedDate, setSelectedDate] = useState(dateFromString(getTodayDateStr()))
    const [showModal, setShowModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showRecurring, setShowRecurring] = useState(false)
    const [recurrencePattern, setRecurrencePattern] = useState('daily')
    const [selectedPlayers, setSelectedPlayers] = useState([])
    const [assignToEveryone, setAssignToEveryone] = useState(true)

    // Determine player ID for filtering events (null means show all - for staff)
    useEffect(() => {
        const loadPlayers = async () => {
            try {
                const allPlayers = await getPlayers()
                setPlayers(allPlayers)
                const player = allPlayers.find(p => p.user_id === profile?.id || p.id === profile?.id)
                if (player) {
                    setCurrentPlayerId(player.id)
                }
            } catch (error) {
                console.error('Error loading players:', error)
            }
        }
        loadPlayers()
    }, [profile])

    // Use realtime events hook
    const { events, loading: eventsLoading, refreshEvents } = useRealtimeEvents({
        playerId: currentPlayerId,
        showNotifications: true
    })

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
        const dateStr = formatDateStr(date)
        return events.filter(e => e.date === dateStr)
    }

    const getEventTypeIcon = (type) => {
        const iconProps = { size: 16 }
        switch (type) {
            case 'training': return <Activity {...iconProps} />
            case 'gym': return <Dumbbell {...iconProps} />
            case 'match': return <Trophy {...iconProps} />
            case 'german_class': return <Globe {...iconProps} />
            case 'online_school': return <Laptop {...iconProps} />
            case 'meeting': return <Users {...iconProps} />
            case 'assessment': return <BarChart3 {...iconProps} />
            case 'social': return <PartyPopper {...iconProps} />
            case 'recovery': return <Heart {...iconProps} />
            default: return <CalendarIcon {...iconProps} />
        }
    }

    const getEventTypeColor = (type) => {
        const colors = {
            training: '#22C55E',
            gym: '#8B5CF6',
            match: '#EF4444',
            german_class: '#F59E0B',
            online_school: '#3B82F6',
            meeting: '#6366F1',
            assessment: '#F97316',
            social: '#DC143C',
            recovery: '#10B981'
        }
        return colors[type] || '#3B82F6'
    }

    const isToday = (date) => {
        return formatDateStr(date) === getTodayDateStr()
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
        const today = dateFromString(getTodayDateStr())
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
        setShowRecurring(false)
        setRecurrencePattern('daily')
        setSelectedPlayers([])
        setAssignToEveryone(true)
    }

    const generateRecurringEvents = (baseEvent, recurrence) => {
        const events = []
        const startDate = new Date(baseEvent.date)
        const { pattern, endDate, daysOfWeek } = recurrence

        let currentDate = new Date(startDate)
        const endDateTime = endDate ? new Date(endDate) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) // Default 1 year

        let eventIndex = 0
        const maxEvents = 100 // Safety limit

        while (currentDate <= endDateTime && eventIndex < maxEvents) {
            // For weekly recurrence, check if current day matches selected days
            if (pattern === 'weekly' && daysOfWeek) {
                const dayOfWeek = currentDate.getDay()
                if (daysOfWeek.includes(dayOfWeek)) {
                    events.push({
                        ...baseEvent,
                        id: `${baseEvent.id}_${eventIndex}`,
                        date: currentDate.toISOString().split('T')[0]
                    })
                    eventIndex++
                }
                currentDate.setDate(currentDate.getDate() + 1)
            } else if (pattern === 'daily') {
                events.push({
                    ...baseEvent,
                    id: `${baseEvent.id}_${eventIndex}`,
                    date: currentDate.toISOString().split('T')[0]
                })
                eventIndex++
                currentDate.setDate(currentDate.getDate() + 1)
            } else if (pattern === 'monthly') {
                events.push({
                    ...baseEvent,
                    id: `${baseEvent.id}_${eventIndex}`,
                    date: currentDate.toISOString().split('T')[0]
                })
                eventIndex++
                currentDate.setMonth(currentDate.getMonth() + 1)
            }

            // Safety check
            if (eventIndex === 0 && currentDate > endDateTime) break
        }

        return events
    }

    const handleSaveEvent = async (e) => {
        e.preventDefault()
        const form = e.target
        const isRecurring = form.recurring?.checked

        try {
            const eventDate = new Date(form.date.value)
            const startDateTime = new Date(`${form.date.value}T${form.startTime.value}:00`)
            const endDateTime = new Date(`${form.date.value}T${form.endTime.value}:00`)

            const baseEvent = {
                title: form.title.value,
                type: form.type.value,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                location: form.location.value
            }

            if (selectedEvent) {
                // Update existing event
                await updateEvent(selectedEvent.id, baseEvent)
                await refreshEvents()
            } else if (isRecurring) {
                // Handle recurring events
                const daysOfWeek = form.recurrencePattern.value === 'weekly'
                    ? Array.from(form.querySelectorAll('input[name="daysOfWeek"]:checked')).map(cb => parseInt(cb.value))
                    : null

                const recurrence = {
                    pattern: form.recurrencePattern.value,
                    endDate: form.recurrenceEndDate.value,
                    daysOfWeek
                }

                const recurringEvents = generateRecurringEvents(baseEvent, recurrence)

                // Create all recurring events
                for (const event of recurringEvents) {
                    const created = await createEvent({
                        ...baseEvent,
                        start_time: event.start_time,
                        end_time: event.end_time
                    })

                    // Assign players if not everyone
                    if (!assignToEveryone && selectedPlayers.length > 0) {
                        await createEventAttendees(created.id, selectedPlayers)
                    }
                }

                await refreshEvents()
            } else {
                // Create single event
                const created = await createEvent(baseEvent)

                // Assign players if not everyone
                if (!assignToEveryone && selectedPlayers.length > 0) {
                    await createEventAttendees(created.id, selectedPlayers)
                }

                await refreshEvents()
            }
            closeModal()
        } catch (error) {
            console.error('Error saving event:', error)
            alert('Error saving event. Please try again.')
        }
    }

    const handleDeleteEvent = async (eventId) => {
        if (confirm('Are you sure you want to delete this event?')) {
            // The realtime subscription will handle updating the UI
            // For now, just trigger a refresh (in the future, add deleteEvent to data-service)
            await refreshEvents()
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
                    <ConnectionStatus showLabel />
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
                                        <span className="event-time">{formatEventTime(event.start_time)}</span>
                                        <span className="event-duration">
                                            {formatEventTime(event.end_time)}
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
                                        <option value="training">Team Training</option>
                                        <option value="gym">Gym Session</option>
                                        <option value="match">GSA League Match</option>
                                        <option value="german_class">German Class</option>
                                        <option value="online_school">Online School / ASU Prep</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="assessment">Assessment</option>
                                        <option value="recovery">Recovery</option>
                                        <option value="social">Social Event</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            name="date"
                                            type="date"
                                            className="input"
                                            defaultValue={selectedEvent?.date || formatDateStr(selectedDate)}
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

                                {/* Player Assignment */}
                                {isStaff && !selectedEvent && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div className="input-group">
                                            <label className="input-label">Assign To</label>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="assignmentType"
                                                        checked={assignToEveryone}
                                                        onChange={() => {
                                                            setAssignToEveryone(true)
                                                            setSelectedPlayers([])
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span>Everyone</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name="assignmentType"
                                                        checked={!assignToEveryone}
                                                        onChange={() => setAssignToEveryone(false)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span>Specific Players</span>
                                                </label>
                                            </div>
                                        </div>

                                        {!assignToEveryone && (
                                            <div className="input-group">
                                                <label className="input-label">Select Players</label>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                    gap: '0.5rem',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    padding: '0.5rem',
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--glass-border)'
                                                }}>
                                                    {players.map(player => (
                                                        <label key={player.id} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            padding: '0.5rem',
                                                            background: selectedPlayers.includes(player.id) ? 'var(--glass-hover)' : 'transparent',
                                                            borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer',
                                                            transition: 'background var(--transition-fast)'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPlayers.includes(player.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedPlayers(prev => [...prev, player.id])
                                                                    } else {
                                                                        setSelectedPlayers(prev => prev.filter(id => id !== player.id))
                                                                    }
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                            <span style={{ fontSize: '0.875rem' }}>
                                                                {player.first_name} {player.last_name}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {selectedPlayers.length > 0 && (
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
                                                        {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Recurring Event Options */}
                                {!selectedEvent && (
                                    <div className="input-group" style={{ marginTop: '1.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name="recurring"
                                                checked={showRecurring}
                                                onChange={(e) => setShowRecurring(e.target.checked)}
                                                style={{ width: 'auto', cursor: 'pointer' }}
                                            />
                                            <span className="input-label" style={{ marginBottom: 0 }}>Recurring Event</span>
                                        </label>
                                    </div>
                                )}

                                {showRecurring && !selectedEvent && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                        <div className="input-group">
                                            <label className="input-label">Repeat Pattern</label>
                                            <select
                                                name="recurrencePattern"
                                                className="input"
                                                value={recurrencePattern}
                                                onChange={(e) => setRecurrencePattern(e.target.value)}
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>

                                        {recurrencePattern === 'weekly' && (
                                            <div className="input-group">
                                                <label className="input-label">Repeat On</label>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                        <label key={day} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            padding: '0.5rem',
                                                            background: 'var(--glass-bg)',
                                                            border: '1px solid var(--glass-border)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                name="daysOfWeek"
                                                                value={index}
                                                                style={{ width: 'auto', cursor: 'pointer' }}
                                                            />
                                                            {day}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="input-group">
                                            <label className="input-label">End Date</label>
                                            <input
                                                name="recurrenceEndDate"
                                                type="date"
                                                className="input"
                                                min={formatDateStr(selectedDate)}
                                                required={showRecurring}
                                            />
                                        </div>
                                    </div>
                                )}
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
