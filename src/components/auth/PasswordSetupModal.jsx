import { useState, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function PasswordSetupModal() {
    const { setupPassword, completePasswordSetup, user } = useAuth()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const passwordStrength = useMemo(() => {
        if (password.length === 0) return { score: 0, label: '', color: '' }
        if (password.length < 6) return { score: 1, label: 'Too short', color: 'var(--color-error)' }
        if (password.length < 8) return { score: 2, label: 'Weak', color: 'var(--color-warning)' }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return { score: 3, label: 'Moderate', color: '#EAB308' }
        }
        if (password.length >= 12 && /[!@#$%^&*]/.test(password)) {
            return { score: 5, label: 'Strong', color: 'var(--color-success)' }
        }
        return { score: 4, label: 'Good', color: 'var(--color-success)' }
    }, [password])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        setError(null)

        const result = await setupPassword(password)

        if (result.success) {
            setSuccess(true)
            // Show success message for 2 seconds, then close modal
            setTimeout(() => {
                completePasswordSetup()
            }, 2000)
        } else {
            setError(result.error || 'Failed to set password')
        }

        setLoading(false)
    }

    if (success) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <div style={styles.successIcon}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 style={styles.successTitle}>Password Set!</h2>
                    <p style={styles.successText}>You can now sign in faster with your email and password.</p>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerContent}>
                        <div style={styles.iconWrapper}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={styles.title}>Set Your Password</h2>
                            <p style={styles.subtitle}>Required to access the app</p>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div style={styles.infoBox}>
                    <p style={styles.email}>{user?.email}</p>
                    <p style={styles.infoText}>Create a password so you can easily log back in anytime.</p>
                </div>

                {/* Error */}
                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>New Password</label>
                        <div style={styles.inputWrapper}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                style={styles.input}
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.toggleButton}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {password.length > 0 && (
                            <div style={styles.strengthWrapper}>
                                <div style={styles.strengthBar}>
                                    <div
                                        style={{
                                            ...styles.strengthFill,
                                            width: `${passwordStrength.score * 20}%`,
                                            backgroundColor: passwordStrength.color
                                        }}
                                    />
                                </div>
                                <span style={{ ...styles.strengthLabel, color: passwordStrength.color }}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <div style={styles.inputWrapper}>
                            <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                style={styles.input}
                                required
                            />
                        </div>
                        {confirmPassword.length > 0 && password !== confirmPassword && (
                            <p style={styles.mismatch}>Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || password.length < 6 || password !== confirmPassword}
                        style={{
                            ...styles.submitButton,
                            width: '100%',
                            marginTop: '0.5rem',
                            opacity: loading || password.length < 6 || password !== confirmPassword ? 0.5 : 1,
                            cursor: loading || password.length < 6 || password !== confirmPassword ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: 18, height: 18 }}></span>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        )}
                        Set Password
                    </button>
                </form>
            </div>
        </div>
    )
}

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
    },
    modal: {
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        maxWidth: '420px',
        width: '100%',
        animation: 'slideUp 0.3s ease'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
    },
    headerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    iconWrapper: {
        width: '40px',
        height: '40px',
        backgroundColor: 'var(--color-primary-glow)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        margin: 0
    },
    subtitle: {
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-tertiary)',
        margin: 0
    },
    infoBox: {
        backgroundColor: 'var(--color-bg-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--glass-border)'
    },
    email: {
        color: 'var(--color-text-primary)',
        fontWeight: 500,
        margin: 0,
        marginBottom: '0.25rem'
    },
    infoText: {
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-tertiary)',
        margin: 0
    },
    errorBox: {
        marginBottom: '1rem',
        padding: '0.75rem',
        backgroundColor: 'var(--color-error-bg)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-error)',
        fontSize: 'var(--font-size-sm)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },
    label: {
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--color-text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputIcon: {
        position: 'absolute',
        left: '1rem',
        color: 'var(--color-text-tertiary)'
    },
    input: {
        width: '100%',
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 3rem 0.75rem 3rem',
        color: 'var(--color-text-primary)',
        fontSize: 'var(--font-size-base)',
        outline: 'none',
        transition: 'var(--transition-fast)'
    },
    toggleButton: {
        position: 'absolute',
        right: '1rem',
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-tertiary)',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center'
    },
    strengthWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    strengthBar: {
        flex: 1,
        height: '4px',
        backgroundColor: 'var(--glass-border)',
        borderRadius: '2px',
        overflow: 'hidden'
    },
    strengthFill: {
        height: '100%',
        transition: 'var(--transition-base)',
        borderRadius: '2px'
    },
    strengthLabel: {
        fontSize: 'var(--font-size-xs)'
    },
    mismatch: {
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-error)',
        margin: 0
    },
    submitButton: {
        flex: 1,
        padding: '0.75rem',
        backgroundColor: 'var(--color-primary)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 'var(--font-size-sm)',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
    },
    successIcon: {
        width: '80px',
        height: '80px',
        backgroundColor: 'var(--color-success-bg)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
        border: '2px solid rgba(16, 185, 129, 0.3)'
    },
    successTitle: {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        textAlign: 'center',
        margin: 0,
        marginBottom: '0.5rem'
    },
    successText: {
        color: 'var(--color-text-tertiary)',
        textAlign: 'center',
        margin: 0
    }
}
