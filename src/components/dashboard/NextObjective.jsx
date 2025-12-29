import React from 'react';

export default function NextObjective() {
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
                    ⚽
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>Team Training</h2>
                    <div style={{ color: 'var(--color-accent)', fontWeight: '500' }}>16:00 - 18:00</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Ostkampfbahn • Pitch 2</div>
                </div>

                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>02:45:12</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>TIME TO START</div>
                </div>
            </div>
        </div>
    );
}
