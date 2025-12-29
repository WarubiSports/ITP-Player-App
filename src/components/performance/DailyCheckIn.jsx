import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getDemoData, updateDemoData } from '../../lib/supabase';

export default function DailyCheckIn({ onClose }) {
    const { profile } = useAuth();
    const { success, achievement } = useNotification();
    const [step, setStep] = useState(1);
    const [ratings, setRatings] = useState({ sleep: 5, soreness: 3, mood: 4 });

    const handleRate = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = () => {
        // Save wellness data
        const data = getDemoData();
        const today = new Date().toISOString().split('T')[0];

        // Check if already logged today
        const existingLog = data.wellnessLogs?.find(
            log => log.player_id === profile.id && log.date === today
        );

        if (existingLog) {
            success('Wellness check-in updated!');
        } else {
            const newLog = {
                id: `w${Date.now()}`,
                player_id: profile.id,
                date: today,
                sleep_hours: ratings.sleep * 1.6, // Convert 1-5 to ~1.6-8 hours
                sleep_quality: ratings.sleep,
                energy_level: ratings.mood * 2, // Convert 1-5 to 2-10
                muscle_soreness: ratings.soreness * 2, // Convert 1-5 to 2-10
                stress_level: Math.max(1, 6 - ratings.mood), // Inverse of mood
                mood: ratings.mood >= 4 ? 'good' : ratings.mood >= 2 ? 'okay' : 'tired',
                notes: 'Morning check-in',
                created_at: new Date().toISOString()
            };

            data.wellnessLogs = [...(data.wellnessLogs || []), newLog];
            updateDemoData(data);

            success('Daily check-in completed!');

            // Check for streak achievements
            const recentLogs = data.wellnessLogs
                .filter(log => log.player_id === profile.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            if (recentLogs.length === 7) {
                achievement('Week Warrior', 'Completed 7 daily check-ins!', '🔥');
            } else if (recentLogs.length === 30) {
                achievement('Monthly Master', '30-day check-in streak!', '💪');
            } else if (recentLogs.length % 10 === 0) {
                achievement('Consistency Champion', `${recentLogs.length} check-ins completed!`, '⭐');
            }
        }

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
