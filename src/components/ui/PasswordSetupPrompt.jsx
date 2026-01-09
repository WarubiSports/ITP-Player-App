import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './PasswordSetupPrompt.css'

export default function PasswordSetupPrompt() {
    const { updatePassword, isDemoMode } = useAuth()
    const [show, setShow] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Don't show in demo mode
        if (isDemoMode) return

        // Check if user has already set password or dismissed
        const hasPassword = localStorage.getItem('itp_password_set')
        const dismissed = localStorage.getItem('itp_password_dismissed')

        if (!hasPassword && !dismissed) {
            // Small delay so it doesn't flash immediately on load
            setTimeout(() => setShow(true), 500)
        }
    }, [isDemoMode])

    const handleSetPassword = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        const result = await updatePassword(password)
        setLoading(false)

        if (result.error) {
            setError(result.error.message)
        } else {
            setSuccess('Password set!')
            localStorage.setItem('itp_password_set', 'true')
            setTimeout(() => setShow(false), 1500)
        }
    }

    const handleDismiss = () => {
        localStorage.setItem('itp_password_dismissed', 'true')
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="password-setup-prompt glass-panel">
            {!showForm ? (
                // Initial prompt
                <div className="password-prompt-content">
                    <div className="password-prompt-icon">🔐</div>
                    <div className="password-prompt-text">
                        <h3>Set a password?</h3>
                        <p>Quick login next time without email</p>
                    </div>
                    <div className="password-prompt-actions">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowForm(true)}
                        >
                            Set Password
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleDismiss}
                        >
                            Later
                        </button>
                    </div>
                </div>
            ) : (
                // Password form
                <form onSubmit={handleSetPassword} className="password-form-inline">
                    <div className="password-form-header">
                        <h3>Create Password</h3>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowForm(false)}
                        >
                            ×
                        </button>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <div className="password-form-fields">
                        <input
                            type="password"
                            className="input"
                            placeholder="Password (min 6 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                            autoFocus
                        />
                        <input
                            type="password"
                            className="input"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
