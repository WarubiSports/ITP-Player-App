import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'

// Register service worker for push notifications and offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope)
            })
            .catch((error) => {
                console.log('SW registration failed:', error)
            })
    })
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                    <RealtimeProvider>
                        <NotificationProvider>
                            <App />
                        </NotificationProvider>
                    </RealtimeProvider>
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
)
