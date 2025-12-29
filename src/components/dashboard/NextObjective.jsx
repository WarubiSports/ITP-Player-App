import React, { useState, useEffect } from 'react';
import { getDemoData } from '../../lib/supabase';

const eventIcons = {
    training: '⚽',
    match: '🏆',
    meeting: '👥',
    assessment: '📋'
};

export default function NextObjective() {
    const [nextEvent, setNextEvent] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        // Get next upcoming event
        const data = getDemoData();
        const now = new Date();

        const upcomingEvents = data.events
            .map(event => {
                const eventDate = new Date(event.date + 'T' + event.start_time);
                return { ...event, datetime: eventDate };
            })
            .filter(event => event.datetime > now)
            .sort((a, b) => a.datetime - b.datetime);

        if (upcomingEvents.length > 0) {
            setNextEvent(upcomingEvents[0]);
        }
    }, []);

    useEffect(() => {
        if (!nextEvent) return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = nextEvent.datetime - now;

            if (diff <= 0) {
                setTimeRemaining('LIVE NOW');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextEvent]);

    if (!nextEvent) {
        return (
            <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next Objective</h3>
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
                    <div>No upcoming events</div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next Objective</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    background: 'rgba(227, 6, 19, 0.1)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: 'var(--color-primary)',
                    fontSize: '1.5rem'
                }}>
                    {eventIcons[nextEvent.type] || '📌'}
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>{nextEvent.title}</h2>
                    <div style={{ color: 'var(--color-accent)', fontWeight: '500' }}>
                        {nextEvent.start_time} - {nextEvent.end_time}
                    </div>
                    {nextEvent.location && (
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{nextEvent.location}</div>
                    )}
                </div>

                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {timeRemaining}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {timeRemaining === 'LIVE NOW' ? 'HAPPENING NOW' : 'TIME TO START'}
                    </div>
                </div>
            </div>
        </div>
    );
}
