import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'player'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signUp, isDemoMode } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match')
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters')
        }

        setLoading(true)

        const { error } = await signUp(formData.email, formData.password, {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role
        })

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
                    <h1 className="auth-title">Join the Program</h1>
                    <p className="auth-subtitle">Create your ITP account</p>
                </div>

                {isDemoMode && (
                    <div className="demo-notice">
                        <span className="demo-badge">Demo Mode</span>
                        <p>Account will be created in demo mode</p>
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-form-grid">
                        <div className="input-group">
                            <label className="input-label">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                className="input"
                                placeholder="First name"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                className="input"
                                placeholder="Last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Role</label>
                        <div className="role-selector">
                            <div
                                className={`role-option ${formData.role === 'player' ? 'selected' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, role: 'player' }))}
                            >
                                <div className="role-option-icon">⚽</div>
                                <div className="role-option-label">Player</div>
                                <div className="role-option-desc">Talent program participant</div>
                            </div>
                            <div
                                className={`role-option ${formData.role === 'staff' ? 'selected' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, role: 'staff' }))}
                            >
                                <div className="role-option-icon">👥</div>
                                <div className="role-option-label">Staff</div>
                                <div className="role-option-desc">Coach or support staff</div>
                            </div>
                        </div>
                    </div>

                    <div className="auth-form-grid">
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="input"
                                placeholder="Min 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="input"
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-links">
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        Already have an account?
                    </span>
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </div>
        </div>
    )
}
