import React from 'react';
import { useRealtimeHousePoints } from '../../hooks/useRealtimeHousePoints';
import ConnectionStatus from '../ui/ConnectionStatus';

const HOUSE_COLORS = {
    'Widdersdorf 1': '#E30613',
    'Widdersdorf 2': '#00E5FF',
    'Widdersdorf 3': '#FFD700',
};

export default function LiveLeaderboard() {
    const { houses, loading, animatingHouse } = useRealtimeHousePoints();

    // Transform houses data for display
    const leaders = houses.map(house => ({
        id: house.id,
        name: house.name,
        points: house.total_points,
        color: HOUSE_COLORS[house.name] || '#888888'
    }));

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>House Cup Live</h3>
                <ConnectionStatus showLabel />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-tertiary)' }}>
                    Loading...
                </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {leaders.map((house, index) => (
                    <div
                        key={house.name}
                        className={animatingHouse === house.id ? 'points-update-animation' : ''}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            margin: '-0.5rem',
                            ...(animatingHouse === house.id && {
                                transform: 'scale(1.02)',
                                boxShadow: `0 0 20px ${house.color}40`
                            })
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: index === 0 ? '#FFD700' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: index === 0 ? 'black' : 'white'
                        }}>
                            {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.9rem' }}>{house.name}</span>
                                <span style={{ fontWeight: 'bold' }}>{house.points}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                <div style={{
                                    width: `${leaders.length > 0 ? (house.points / (leaders[0].points * 1.2)) * 100 : 0}%`,
                                    height: '100%',
                                    background: house.color,
                                    borderRadius: '2px',
                                    boxShadow: `0 0 10px ${house.color}`
                                }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}
