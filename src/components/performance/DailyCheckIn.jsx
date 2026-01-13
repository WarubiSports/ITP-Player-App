import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { createWellnessLog, createTrainingLoad, getPlayers } from '../../lib/data-service';
import { getLocalDate } from '../../lib/date-utils';
import { Moon, Footprints, Brain, CircleDot } from 'lucide-react';

export default function DailyCheckIn({ onClose }) {
    const { profile } = useAuth();
    const { success, error: showError, achievement } = useNotification();
    const [step, setStep] = useState(1);
    const [ratings, setRatings] = useState({ sleep: 5, soreness: 3, mood: 4 });
    const [trainingData, setTrainingData] = useState({ duration: 60, rpe: 5, trained: true });
    const [submitting, setSubmitting] = useState(false);

    const handleRate = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleTrainingChange = (field, value) => {
        setTrainingData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Get player ID
            const players = await getPlayers();
            const player = players.find(p => p.id === profile.id || p.user_id === profile.id);

            if (!player) {
                console.error('❌ Player not found. Profile ID:', profile.id);
                throw new Error('Player not found');
            }

            const today = getLocalDate(); // Use CET timezone for correct date

            // Create wellness log
            const wellnessLog = {
                player_id: player.id,
                date: today,
                sleep_hours: ratings.sleep * 1.6, // Convert 1-5 to ~1.6-8 hours
                sleep_quality: ratings.sleep,
                energy_level: ratings.mood * 2, // Convert 1-5 to 2-10
                muscle_soreness: ratings.soreness * 2, // Convert 1-5 to 2-10
                stress_level: Math.max(1, 6 - ratings.mood), // Inverse of mood
                mood: ratings.mood >= 4 ? 'good' : ratings.mood >= 2 ? 'okay' : 'tired',
                notes: 'Morning check-in'
            };

            await createWellnessLog(wellnessLog);

            // Create training load if user trained
            if (trainingData.trained) {
                const trainingLog = {
                    player_id: player.id,
                    date: today,
                    duration: trainingData.duration,
                    rpe: trainingData.rpe,
                    session_type: 'training',
                    load_score: trainingData.duration * trainingData.rpe
                };
                await createTrainingLoad(trainingLog);
            }

            success('Daily check-in completed and saved!');

            onClose();
        } catch (err) {
            console.error('Error saving check-in:', err);
            showError('Failed to save check-in. Please try again.');
            setSubmitting(false);
            // Don't close modal - let user retry
        }
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
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><Moon size={48} /></div>
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
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><Footprints size={48} /></div>
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
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><Brain size={48} /></div>
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

                    {step === 4 && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><CircleDot size={48} /></div>
                            <h3>Did you train yesterday?</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    className={`btn ${trainingData.trained ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleTrainingChange('trained', true)}
                                    style={{ width: '100px' }}
                                >
                                    Yes
                                </button>
                                <button
                                    className={`btn ${!trainingData.trained ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => handleTrainingChange('trained', false)}
                                    style={{ width: '100px' }}
                                >
                                    No
                                </button>
                            </div>
                            {trainingData.trained && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Duration (minutes)</label>
                                        <input
                                            type="number"
                                            value={trainingData.duration}
                                            onChange={(e) => handleTrainingChange('duration', parseInt(e.target.value))}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Intensity (RPE 1-10)</label>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                <button
                                                    key={num}
                                                    className={`btn ${trainingData.rpe === num ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => handleTrainingChange('rpe', num)}
                                                    style={{ width: '35px', height: '35px', padding: 0, fontSize: '0.8rem' }}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    {step < 4 ? (
                        <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} style={{ width: '100%' }}>
                            Next
                        </button>
                    ) : (
                        <button
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{ width: '100%' }}
                        >
                            {submitting ? 'Saving...' : 'Complete Check-In'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
