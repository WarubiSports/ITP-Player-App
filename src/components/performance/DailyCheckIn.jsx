import React, { useState } from 'react';

export default function DailyCheckIn({ onClose }) {
    const [step, setStep] = useState(1);
    const [ratings, setRatings] = useState({ sleep: 5, soreness: 3, mood: 4 });

    const handleRate = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = () => {
        // Calculate score logic here in real app
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Morning Check-In</h2>
                </div>

                <div className="modal-body" style={{ textAlign: 'center' }}>
                    {step === 1 && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😴</div>
                            <h3>How did you sleep?</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        className={`btn ${ratings.sleep === num ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRate('sleep', num)}
                                        style={{ width: '40px', height: '40px', padding: 0 }}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦵</div>
                            <h3>Muscle Soreness?</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>1 = Fresh, 5 = Can't Walk</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        className={`btn ${ratings.soreness === num ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRate('soreness', num)}
                                        style={{ width: '40px', height: '40px', padding: 0 }}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
                            <h3>Mental Energy?</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        className={`btn ${ratings.mood === num ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleRate('mood', num)}
                                        style={{ width: '40px', height: '40px', padding: 0 }}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    {step < 3 ? (
                        <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} style={{ width: '100%' }}>
                            Next
                        </button>
                    ) : (
                        <button className="btn btn-success" onClick={handleSubmit} style={{ width: '100%' }}>
                            Complete Check-In
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
