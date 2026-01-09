import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import NotificationContainer from './components/ui/NotificationContainer'
import EventNotifications from './components/events/EventNotifications'

// Eager load auth pages (needed immediately)
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Lazy load dashboard pages (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Players = lazy(() => import('./pages/Players'))
const Wellness = lazy(() => import('./pages/Wellness'))
const Progress = lazy(() => import('./pages/Progress'))
const Pathway = lazy(() => import('./pages/Pathway'))
const Housing = lazy(() => import('./pages/Housing'))
const Calendar = lazy(() => import('./pages/Calendar'))
const ParentPortal = lazy(() => import('./pages/ParentPortal'))
const GroceryOrder = lazy(() => import('./pages/GroceryOrder'))
const OrderHistory = lazy(() => import('./pages/OrderHistory'))
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
        <>
            <NotificationContainer />
            {user && <EventNotifications />}
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
                    <Route path="wellness" element={<Suspense fallback={<PageLoader />}><Wellness /></Suspense>} />
                    <Route path="progress" element={<Suspense fallback={<PageLoader />}><Progress /></Suspense>} />
                    <Route path="pathway" element={<Suspense fallback={<PageLoader />}><Pathway /></Suspense>} />
                    <Route path="housing" element={<Suspense fallback={<PageLoader />}><Housing /></Suspense>} />
                    <Route path="calendar" element={<Suspense fallback={<PageLoader />}><Calendar /></Suspense>} />
                    <Route path="parent-portal" element={<Suspense fallback={<PageLoader />}><ParentPortal /></Suspense>} />
                    <Route path="grocery" element={<Suspense fallback={<PageLoader />}><GroceryOrder /></Suspense>} />
                    <Route path="order-history" element={<Suspense fallback={<PageLoader />}><OrderHistory /></Suspense>} />
                    <Route path="admin" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><Admin /></Suspense></ProtectedRoute>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </>
    )
}
