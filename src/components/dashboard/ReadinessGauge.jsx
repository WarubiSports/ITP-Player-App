import React from 'react';

export default function ReadinessGauge({ score = 85 }) {
    const circumference = 2 * Math.PI * 40; // radius 40
    const offset = circumference - (score / 100) * circumference;

    let color = '#00E5FF'; // High
    if (score < 70) color = '#FFD700'; // Medium
    if (score < 50) color = '#E30613'; // Low

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Bio-Rhythm</h3>

            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="60"
                        cy="60"
                        r="40"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <circle
                        cx="60"
                        cy="60"
                        r="40"
                        stroke={color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{score}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>READY</div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Peak Performance Zone
            </div>
        </div>
    );
}
