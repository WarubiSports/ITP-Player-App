import { Component } from 'react'

/**
 * Error boundary to catch chunk load failures and other React errors
 * Provides a user-friendly fallback UI with reload option
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    }

    handleReload = () => {
        // Clear any reload flags before manual reload
        sessionStorage.removeItem('chunk_reload_attempted')
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            const isChunkError =
                this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
                this.state.error?.message?.includes('Loading chunk')

            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--color-bg-primary, #f5f5f5)'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        maxWidth: '400px'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            color: '#1a1a1a'
                        }}>
                            {isChunkError ? 'Update Available' : 'Something went wrong'}
                        </h2>
                        <p style={{
                            color: '#666',
                            marginBottom: '1.5rem',
                            lineHeight: '1.5'
                        }}>
                            {isChunkError
                                ? 'A new version of the app is available. Please refresh to get the latest updates.'
                                : 'An unexpected error occurred. Please try refreshing the page.'}
                        </p>
                        <button
                            onClick={this.handleReload}
                            style={{
                                background: 'var(--color-primary, #2563eb)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                            onMouseOut={(e) => e.target.style.background = '#2563eb'}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
