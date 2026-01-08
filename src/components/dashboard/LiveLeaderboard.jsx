import React from 'react';

export default function LiveLeaderboard() {
    const leaders = [
        { name: 'Widdersdorf 1', points: 1250, color: '#E30613' },
        { name: 'Widdersdorf 2', points: 1100, color: '#00E5FF' },
        { name: 'Widdersdorf 3', points: 950, color: '#FFD700' },
    ];

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>House Cup Live</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>● LIVE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {leaders.map((house, index) => (
                    <div key={house.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                                    width: `${(house.points / 1500) * 100}%`,
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
        </div>
    );
}
