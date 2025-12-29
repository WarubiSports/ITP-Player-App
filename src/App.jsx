import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

// Eager load auth pages (needed immediately)
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Lazy load dashboard pages (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Players = lazy(() => import('./pages/Players'))
const Housing = lazy(() => import('./pages/Housing'))
const Chores = lazy(() => import('./pages/Chores'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Messages = lazy(() => import('./pages/Messages'))
const Admin = lazy(() => import('./pages/Admin'))

// Loading component
function PageLoader() {
    return (
        <div style={{
            height: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="spinner spinner-lg"></div>
        </div>
    )
}

export default function App() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-primary)'
            }}>
                <div className="spinner spinner-lg"></div>
            </div>
        )
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                <Route path="players" element={<Suspense fallback={<PageLoader />}><Players /></Suspense>} />
                <Route path="housing" element={<Suspense fallback={<PageLoader />}><Housing /></Suspense>} />
                <Route path="chores" element={<Suspense fallback={<PageLoader />}><Chores /></Suspense>} />
                <Route path="calendar" element={<Suspense fallback={<PageLoader />}><Calendar /></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
                <Route path="admin" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><Admin /></Suspense></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}
