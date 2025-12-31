import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const { resetPassword, isDemoMode } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await resetPassword(email)

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }
        setLoading(false)
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
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">We'll send you recovery instructions</p>
                </div>

                {isDemoMode && (
                    <div className="demo-notice">
                        <span className="demo-badge">Demo Mode</span>
                        <p>Password reset is simulated in demo mode</p>
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {success ? (
                    <div className="auth-success">
                        <span>✅</span>
                        <div>
                            <strong>Check your email</strong>
                            <p style={{ marginTop: '4px', opacity: 0.9 }}>
                                We've sent password reset instructions to {email}
                            </p>
                        </div>
                    </div>
                ) : (
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
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                )}

                <div className="auth-links">
                    <Link to="/login" className="auth-link">← Back to Sign In</Link>
                </div>
            </div>
        </div>
    )
}
