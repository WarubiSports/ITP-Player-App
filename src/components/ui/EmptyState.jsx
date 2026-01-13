import React from 'react'
import { Inbox } from 'lucide-react'
import './EmptyState.css'

export default function EmptyState({
    icon = <Inbox size={48} />,
    title = 'Nothing here yet',
    message = '',
    actionLabel,
    onAction
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            {message && <p className="empty-state-message">{message}</p>}
            {actionLabel && onAction && (
                <button className="btn btn-primary empty-state-action" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
