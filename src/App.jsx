import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import NotificationContainer from './components/ui/NotificationContainer'
import EventNotifications from './components/events/EventNotifications'
import { lazyWithRetry } from './utils/lazyWithRetry'

// Eager load auth pages (needed immediately)
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import SSO from './pages/auth/SSO'

// Lazy load dashboard pages with chunk error recovery
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'Dashboard')
const Wellness = lazyWithRetry(() => import('./pages/Wellness'), 'Wellness')
const Progress = lazyWithRetry(() => import('./pages/Progress'), 'Progress')
const Pathway = lazyWithRetry(() => import('./pages/Pathway'), 'Pathway')
const Housing = lazyWithRetry(() => import('./pages/Housing'), 'Housing')
const Calendar = lazyWithRetry(() => import('./pages/Calendar'), 'Calendar')
const ParentPortal = lazyWithRetry(() => import('./pages/ParentPortal'), 'ParentPortal')
const GroceryOrder = lazyWithRetry(() => import('./pages/GroceryOrder'), 'GroceryOrder')
const OrderHistory = lazyWithRetry(() => import('./pages/OrderHistory'), 'OrderHistory')
const Admin = lazyWithRetry(() => import('./pages/Admin'), 'Admin')
const PlayerReport = lazyWithRetry(() => import('./pages/PlayerReport'), 'PlayerReport')

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
                <Route path="/auth/sso" element={<SSO />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                    <Route path="wellness" element={<Suspense fallback={<PageLoader />}><Wellness /></Suspense>} />
                    <Route path="progress" element={<Suspense fallback={<PageLoader />}><Progress /></Suspense>} />
                    <Route path="pathway" element={<Suspense fallback={<PageLoader />}><Pathway /></Suspense>} />
                    <Route path="housing" element={<Suspense fallback={<PageLoader />}><Housing /></Suspense>} />
                    <Route path="calendar" element={<Suspense fallback={<PageLoader />}><Calendar /></Suspense>} />
                    <Route path="parent-portal" element={<Suspense fallback={<PageLoader />}><ParentPortal /></Suspense>} />
                    <Route path="grocery" element={<Suspense fallback={<PageLoader />}><GroceryOrder /></Suspense>} />
                    <Route path="order-history" element={<Suspense fallback={<PageLoader />}><OrderHistory /></Suspense>} />
                    <Route path="my-report" element={<Suspense fallback={<PageLoader />}><PlayerReport /></Suspense>} />
                    <Route path="admin" element={<ProtectedRoute adminOnly><Suspense fallback={<PageLoader />}><Admin /></Suspense></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute staffOnly><Suspense fallback={<PageLoader />}><PlayerReport /></Suspense></ProtectedRoute>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </>
    )
}
