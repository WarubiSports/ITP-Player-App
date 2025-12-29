import React from 'react';

export default function Marketplace({ onClose }) {
    const items = [
        { id: 1, name: 'Late Curfew Pass', cost: 500, icon: '🌙', desc: 'Extend curfew by 1 hour (Fri/Sat only)' },
        { id: 2, name: '1.FC Köln Hoodie', cost: 2500, icon: '👕', desc: 'Limited edition Academy hoodie' },
        { id: 3, name: 'Private Physio Session', cost: 1000, icon: '💆', desc: 'Extra 30min recovery session' },
        { id: 4, name: 'FIFA Tournament Entry', cost: 200, icon: '🎮', desc: 'Buy-in for the weekly house tournament' },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Academy Store</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0, 229, 255, 0.1)', borderRadius: '12px', border: '1px solid var(--color-accent)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Your Balance</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>2,450 GC</span>
                    </div>

                    <div className="grid grid-2">
                        {items.map(item => (
                            <div key={item.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>{item.name}</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', flex: 1 }}>{item.desc}</p>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                                    Buy {item.cost}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
