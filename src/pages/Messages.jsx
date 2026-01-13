import { useState, useEffect } from 'react'
import { demoData } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Inbox, Send, MailX, MessageSquare } from 'lucide-react'
import './Messages.css'

export default function Messages() {
    const { profile } = useAuth()
    const [messages, setMessages] = useState([])
    const [showCompose, setShowCompose] = useState(false)
    const [selectedMessage, setSelectedMessage] = useState(null)
    const [filter, setFilter] = useState('inbox')

    useEffect(() => {
        setMessages(demoData.messages)
    }, [])

    const getUserName = (userId) => {
        const user = demoData.users.find(u => u.id === userId)
        if (user) return `${user.first_name} ${user.last_name}`
        const player = demoData.players.find(p => p.id === userId)
        if (player) return `${player.first_name} ${player.last_name}`
        return 'Unknown'
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const handleMarkRead = (messageId) => {
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, is_read: true } : m
        ))
    }

    const handleSelectMessage = (msg) => {
        setSelectedMessage(msg)
        if (!msg.is_read) {
            handleMarkRead(msg.id)
        }
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        const form = e.target
        const newMessage = {
            id: `m${Date.now()}`,
            from_user: profile?.id || 'admin-1',
            to_user: form.recipient.value,
            subject: form.subject.value,
            content: form.content.value,
            is_read: false,
            created_at: new Date().toISOString()
        }
        setMessages(prev => [newMessage, ...prev])
        setShowCompose(false)
    }

    const inboxMessages = messages.filter(m => m.to_user === (profile?.id || 'admin-1'))
    const sentMessages = messages.filter(m => m.from_user === (profile?.id || 'admin-1'))
    const unreadCount = inboxMessages.filter(m => !m.is_read).length

    const displayMessages = filter === 'inbox' ? inboxMessages : sentMessages

    return (
        <div className="messages-page">
            {/* Sidebar */}
            <div className="messages-sidebar glass-card-static">
                <button className="btn btn-primary w-full mb-4" onClick={() => setShowCompose(true)}>
                    <Mail size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Compose
                </button>

                <nav className="messages-nav">
                    <button
                        className={`nav-btn ${filter === 'inbox' ? 'active' : ''}`}
                        onClick={() => setFilter('inbox')}
                    >
                        <span className="nav-icon"><Inbox size={16} /></span>
                        <span className="nav-label">Inbox</span>
                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </button>
                    <button
                        className={`nav-btn ${filter === 'sent' ? 'active' : ''}`}
                        onClick={() => setFilter('sent')}
                    >
                        <span className="nav-icon"><Send size={16} /></span>
                        <span className="nav-label">Sent</span>
                    </button>
                </nav>
            </div>

            {/* Messages List */}
            <div className="messages-list glass-card-static">
                <div className="messages-list-header">
                    <h3>{filter === 'inbox' ? 'Inbox' : 'Sent Messages'}</h3>
                    <span className="message-count">{displayMessages.length} messages</span>
                </div>

                <div className="messages-items">
                    {displayMessages.map(msg => (
                        <div
                            key={msg.id}
                            className={`message-item ${!msg.is_read && filter === 'inbox' ? 'unread' : ''} ${selectedMessage?.id === msg.id ? 'selected' : ''}`}
                            onClick={() => handleSelectMessage(msg)}
                        >
                            <div className="avatar avatar-sm">
                                {getUserName(filter === 'inbox' ? msg.from_user : msg.to_user).split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="message-preview">
                                <div className="message-header">
                                    <span className="message-sender">
                                        {filter === 'inbox' ? `From: ${getUserName(msg.from_user)}` : `To: ${getUserName(msg.to_user)}`}
                                    </span>
                                    <span className="message-date">{formatDate(msg.created_at)}</span>
                                </div>
                                <div className="message-subject">{msg.subject}</div>
                                <div className="message-excerpt">{msg.content.substring(0, 60)}...</div>
                            </div>
                        </div>
                    ))}

                    {displayMessages.length === 0 && (
                        <div className="empty-messages">
                            <span className="empty-icon"><MailX size={32} /></span>
                            <p>No messages</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Message Detail */}
            <div className="message-detail glass-card-static">
                {selectedMessage ? (
                    <>
                        <div className="detail-header">
                            <h3 className="detail-subject">{selectedMessage.subject}</h3>
                            <div className="detail-meta">
                                <span>{filter === 'inbox' ? 'From' : 'To'}: <strong>{getUserName(filter === 'inbox' ? selectedMessage.from_user : selectedMessage.to_user)}</strong></span>
                                <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="detail-content">
                            <p>{selectedMessage.content}</p>
                        </div>
                        {filter === 'inbox' && (
                            <div className="detail-actions">
                                <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
                                    Reply
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-selection">
                        <span className="no-selection-icon"><MessageSquare size={32} /></span>
                        <p>Select a message to view</p>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <div className="modal-overlay" onClick={() => setShowCompose(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">New Message</h3>
                            <button className="modal-close" onClick={() => setShowCompose(false)}>×</button>
                        </div>
                        <form onSubmit={handleSendMessage}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">To</label>
                                    <select name="recipient" className="input" required>
                                        <option value="">-- Select Recipient --</option>
                                        {demoData.players.map(p => (
                                            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                        ))}
                                        {demoData.users.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Subject</label>
                                    <input name="subject" className="input" required />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Message</label>
                                    <textarea name="content" className="input textarea" rows="6" required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCompose(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
