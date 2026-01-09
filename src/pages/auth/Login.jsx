import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { signIn, signInWithMagicLink } = useAuth()
    const navigate = useNavigate()

    // Magic Link login - primary method for players
    const handleMagicLink = async (e) => {
        e.preventDefault()
        if (!email) {
            setError('Please enter your email address')
            return
        }

        setError('')
        setSuccess('')
        setLoading(true)

        const { error, message } = await signInWithMagicLink(email)

        if (error) {
            setError(error.message)
        } else {
            setSuccess(message || 'Check your email for the login link!')
        }
        setLoading(false)
    }

    // Password login - for staff or fallback
    const handlePasswordLogin = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        const { error } = await signIn(email, password)

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

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {success && (
                    <div className="auth-success">
                        <span>✉️</span> {success}
                    </div>
                )}

                <form onSubmit={handleMagicLink} className="auth-form">
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <span>✉️</span> Send Login Link
                            </>
                        )}
                    </button>

                    <p className="auth-hint">
                        We'll email you a magic link for instant sign-in
                    </p>
                </form>

                {/* Expandable password section for staff */}
                <div className="auth-divider-line">
                    <span>or</span>
                </div>

                <button
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? 'Hide' : 'Sign in with password'}
                </button>

                {showPassword && (
                    <form onSubmit={handlePasswordLogin} className="auth-form auth-form-secondary">
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

                        <button
                            type="submit"
                            className="btn btn-secondary btn-lg w-full"
                            disabled={loading}
                        >
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
                )}

                <div className="auth-links">
                    <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                </div>

                <div className="auth-footer">
                    <p>Powered by Warubi Sports</p>
                </div>
            </div>
        </div>
    )
}
