import React, { useState, useEffect } from 'react';
import { getEvents, getChores } from '../../lib/data-service';
import { useAuth } from '../../contexts/AuthContext';
import {
    Activity,
    Trophy,
    Users,
    ClipboardList,
    Dumbbell,
    Globe,
    Laptop,
    Heart,
    PartyPopper,
    Circle,
    Sparkles,
    CheckCircle,
    MapPin
} from 'lucide-react';

const EventIcon = ({ type }) => {
    const iconProps = { size: 24 };
    switch (type) {
        case 'training': return <Activity {...iconProps} />;
        case 'match': return <Trophy {...iconProps} />;
        case 'meeting': return <Users {...iconProps} />;
        case 'assessment': return <ClipboardList {...iconProps} />;
        case 'gym': return <Dumbbell {...iconProps} />;
        case 'german_class': return <Globe {...iconProps} />;
        case 'online_school': return <Laptop {...iconProps} />;
        case 'recovery': return <Heart {...iconProps} />;
        case 'social': return <PartyPopper {...iconProps} />;
        default: return <MapPin {...iconProps} />;
    }
};

const PriorityIcon = ({ priority }) => {
    const colors = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };
    return <Circle size={24} fill={colors[priority] || '#888'} color={colors[priority] || '#888'} />;
};

export default function NextObjective() {
    const [nextItem, setNextItem] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        loadNextObjective();
    }, [user]);

    const loadNextObjective = async () => {
        try {
            const [events, chores] = await Promise.all([getEvents(), getChores()]);
            const now = new Date();

            // Process events
            const upcomingEvents = events
                .map(event => {
                    let eventDate;
                    if (event.date && event.start_time) {
                        eventDate = new Date(event.date + 'T' + event.start_time);
                    } else if (event.start_time) {
                        eventDate = new Date(event.start_time);
                    }
                    return { ...event, datetime: eventDate, itemType: 'event' };
                })
                .filter(event => event.datetime && event.datetime > now);

            // Process tasks (pending chores assigned to current user)
            const pendingTasks = chores
                .filter(chore => chore.status === 'pending' && chore.assigned_to === user?.id)
                .map(chore => {
                    const deadlineDate = chore.deadline ? new Date(chore.deadline + 'T23:59:59') : null;
                    return {
                        ...chore,
                        datetime: deadlineDate,
                        itemType: 'task',
                        title: chore.title
                    };
                })
                .filter(task => task.datetime);

            // Combine and sort by datetime (soonest first)
            const allItems = [...upcomingEvents, ...pendingTasks]
                .sort((a, b) => a.datetime - b.datetime);

            if (allItems.length > 0) {
                setNextItem(allItems[0]);
            }
        } catch (error) {
            console.error('Error loading next objective:', error);
        }
    };

    useEffect(() => {
        if (!nextItem) return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = nextItem.datetime - now;

            if (diff <= 0) {
                setTimeRemaining(nextItem.itemType === 'task' ? 'OVERDUE' : 'LIVE NOW');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h`);
            } else {
                setTimeRemaining(
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                );
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextItem]);

    if (!nextItem) {
        return (
            <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next Objective</h3>
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                    <div style={{ marginBottom: '0.5rem' }}><Sparkles size={48} /></div>
                    <div>All caught up!</div>
                </div>
            </div>
        );
    }

    const isTask = nextItem.itemType === 'task';
    const label = isTask ? 'TASK DUE' : 'TIME TO START';
    const overdueLabel = isTask ? 'TASK OVERDUE' : 'HAPPENING NOW';

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next Objective</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    background: isTask ? 'rgba(255, 193, 7, 0.1)' : 'rgba(227, 6, 19, 0.1)',
                    border: `1px solid ${isTask ? '#FFC107' : 'var(--color-primary)'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    color: isTask ? '#FFC107' : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isTask ? <PriorityIcon priority={nextItem.priority} /> : <EventIcon type={nextItem.type} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextItem.title}</h2>
                    <div style={{ color: 'var(--color-accent)', fontWeight: '500', fontSize: '0.9rem' }}>
                        {isTask ? (
                            `Due: ${nextItem.datetime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                        ) : (
                            <>
                                {nextItem.datetime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                {nextItem.end_time && ` - ${new Date(nextItem.date + 'T' + nextItem.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                            </>
                        )}
                    </div>
                    {!isTask && nextItem.location && (
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{nextItem.location}</div>
                    )}
                    {isTask && (
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{nextItem.points} pts • {nextItem.priority} priority</div>
                    )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {timeRemaining}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {timeRemaining === 'LIVE NOW' || timeRemaining === 'OVERDUE' ? overdueLabel : label}
                    </div>
                </div>
            </div>
        </div>
    );
}
