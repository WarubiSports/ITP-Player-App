import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SSO() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [error, setError] = useState('')

  useEffect(() => {
    const handleSSO = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        setStatus('error')
        setError('Missing authentication tokens')
        return
      }

      try {
        // Decode the JWT to get user ID BEFORE setting session
        // This allows us to set the localStorage key before AuthContext's onAuthStateChange fires
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
        const userId = tokenPayload.sub

        // Mark SSO users as having dismissed password setup BEFORE setting session
        // (They're already authenticated through the staff app)
        if (userId) {
          localStorage.setItem('itp_password_setup_dismissed', userId)
        }

        // Set the session using the tokens from the staff app
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          throw sessionError
        }

        setStatus('success')
        // Redirect to dashboard after successful SSO
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1000)
      } catch (err) {
        setStatus('error')
        setError(err.message || 'Failed to authenticate')
      }
    }

    handleSSO()
  }, [searchParams, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary, #f9fafb)'
    }}>
      <div style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--color-text-secondary, #6b7280)' }}>Signing you in...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{
              width: 48,
              height: 48,
              background: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>Signed in successfully!</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary, #6b7280)', marginTop: 4 }}>Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{
              width: 48,
              height: 48,
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>Sign in failed</p>
            <p style={{ fontSize: 14, color: '#dc2626', marginTop: 4 }}>{error}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
