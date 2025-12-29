import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getDemoData, updateDemoData } from '../../lib/supabase';

export default function Marketplace({ onClose }) {
    const { profile } = useAuth();
    const { success, error, achievement } = useNotification();
    const [balance, setBalance] = useState(0);
    const [purchases, setPurchases] = useState([]);

    const items = [
        { id: 1, name: 'Late Curfew Pass', cost: 500, icon: '🌙', desc: 'Extend curfew by 1 hour (Fri/Sat only)' },
        { id: 2, name: '1.FC Köln Hoodie', cost: 2500, icon: '👕', desc: 'Limited edition Academy hoodie' },
        { id: 3, name: 'Private Physio Session', cost: 1000, icon: '💆', desc: 'Extra 30min recovery session' },
        { id: 4, name: 'FIFA Tournament Entry', cost: 200, icon: '🎮', desc: 'Buy-in for the weekly house tournament' },
    ];

    useEffect(() => {
        const data = getDemoData();
        const player = data.players.find(p => p.id === profile.id);
        setBalance(player?.points || 0);
        setPurchases(data.purchases || []);
    }, [profile.id]);

    const handlePurchase = (item) => {
        if (balance < item.cost) {
            error('Insufficient balance! Complete more tasks to earn points.');
            return;
        }

        const data = getDemoData();
        const player = data.players.find(p => p.id === profile.id);

        // Deduct points
        player.points -= item.cost;

        // Record purchase
        const purchase = {
            id: `pur${Date.now()}`,
            player_id: profile.id,
            item_id: item.id,
            item_name: item.name,
            cost: item.cost,
            date: new Date().toISOString()
        };

        data.purchases = [...(data.purchases || []), purchase];
        updateDemoData(data);

        setBalance(player.points);
        setPurchases(data.purchases);

        success(`Purchased ${item.name}!`);

        // Check for achievements
        const playerPurchases = data.purchases.filter(p => p.player_id === profile.id);
        if (playerPurchases.length === 1) {
            achievement('First Purchase', 'Welcome to the Academy Store!', '🛍️');
        } else if (playerPurchases.length === 10) {
            achievement('Big Spender', 'Made 10 purchases!', '💸');
        }

        // Special achievement for buying hoodie
        if (item.id === 2) {
            achievement('Team Pride', 'Representing 1.FC Köln!', '👕');
        }
    };

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
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>{balance.toLocaleString()} GC</span>
                    </div>

                    <div className="grid grid-2">
                        {items.map(item => {
                            const canAfford = balance >= item.cost;
                            return (
                                <div key={item.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: canAfford ? 1 : 0.6 }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{item.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', flex: 1 }}>{item.desc}</p>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                        onClick={() => handlePurchase(item)}
                                        disabled={!canAfford}
                                    >
                                        {canAfford ? `Buy ${item.cost} GC` : `Need ${item.cost - balance} more`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
