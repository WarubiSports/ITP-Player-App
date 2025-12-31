import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, isDemoMode } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    const handleDemoLogin = async (type) => {
        setError('')
        setLoading(true)

        const credentials = type === 'player'
            ? { email: 'max.finkgrafe@player.com', password: 'ITP2024' }
            : { email: 'max.bisinger@warubi-sports.com', password: 'ITP2024' }

        setEmail(credentials.email)
        setPassword(credentials.password)

        const { error } = await signIn(credentials.email, credentials.password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="auth-glow"></div>
                <div className="auth-glow auth-glow-2"></div>
            </div>

            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/fc-koln-logo.png" alt="1.FC Köln" className="auth-logo-img" />
                    <h1 className="auth-title">1.FC Köln</h1>
                    <p className="auth-subtitle">International Talent Program</p>
                </div>

                {isDemoMode && (
                    <div className="demo-notice">
                        <span className="demo-badge">Demo Mode</span>
                        <p>Use: max.bisinger@warubi-sports.com / ITP2024</p>
                    </div>
                )}

                {!isDemoMode && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem' }}
                            onClick={() => {
                                setEmail('demo.player@itp.com')
                                setPassword('Demo2024')
                            }}
                        >
                            🎮 Demo Player
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem' }}
                            onClick={() => {
                                setEmail('max.bisinger@warubi-sports.com')
                                setPassword('ITP2024')
                            }}
                        >
                            👥 Demo Staff
                        </button>
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {isDemoMode && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{
                            margin: '0 0 1rem 0',
                            fontWeight: '600',
                            color: 'var(--color-text-secondary)',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                        }}>
                            Quick Demo Login
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('player')}
                                disabled={loading}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.95rem',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                                        e.target.style.borderColor = 'var(--color-accent)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                🎮 Demo Player
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('staff')}
                                disabled={loading}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    color: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontSize: '0.95rem',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                                        e.target.style.borderColor = 'var(--color-accent)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                👥 Demo Staff
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                    <span className="auth-divider">•</span>
                    <Link to="/register" className="auth-link">Create account</Link>
                </div>

                <div className="auth-footer">
                    <p>Powered by Warubi Sports</p>
                </div>
            </div>
        </div>
    )
}
