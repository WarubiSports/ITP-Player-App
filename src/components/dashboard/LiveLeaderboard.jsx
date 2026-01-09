import React, { useState, useEffect } from 'react';
import { getHouses } from '../../lib/data-service';

const HOUSE_COLORS = {
    'Widdersdorf 1': '#E30613',
    'Widdersdorf 2': '#00E5FF',
    'Widdersdorf 3': '#FFD700',
};

export default function LiveLeaderboard() {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        const loadHouses = async () => {
            try {
                const houses = await getHouses();
                // Sort by points descending and add colors
                const sorted = houses
                    .sort((a, b) => b.total_points - a.total_points)
                    .map(house => ({
                        name: house.name,
                        points: house.total_points,
                        color: HOUSE_COLORS[house.name] || '#888888'
                    }));
                setLeaders(sorted);
            } catch (error) {
                console.error('Error loading houses:', error);
            }
        };
        loadHouses();
    }, []);

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
        </div>
    );
}
