import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, checkIsDemoMode, demoData } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// Demo password for all demo accounts
const DEMO_PASSWORD = 'ITP2024'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for demo user first
        const demoUser = localStorage.getItem('itp_demo_user')
        if (demoUser) {
            const parsed = JSON.parse(demoUser)
            setUser(parsed)
            setProfile(parsed)
            setLoading(false)
            return
        }

        // Check for existing Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            }
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
    }

    const signIn = async (email, password) => {
        // Try Supabase auth first if configured
        if (import.meta.env.VITE_SUPABASE_URL) {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (!error) {
                return { error: null }
            }
            // If Supabase auth fails, try demo login as fallback
            console.log('Supabase auth failed, trying demo login...')
        }

        // Try demo login (either as primary or fallback)
        const demoUser = demoData.users.find(u => u.email.toLowerCase() === email.toLowerCase())
        if (demoUser && password === DEMO_PASSWORD) {
            localStorage.setItem('itp_demo_user', JSON.stringify(demoUser))
            setUser(demoUser)
            setProfile(demoUser)
            return { error: null }
        }

        return { error: { message: 'Invalid login credentials' } }
    }

    const signUp = async (email, password, metadata = {}) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        })
        return { error }
    }

    const signOut = async () => {
        // Clear demo user
        localStorage.removeItem('itp_demo_user')

        const { error } = await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        return { error }
    }

    const resetPassword = async (email) => {
        // In demo mode, simulate successful password reset
        if (checkIsDemoMode()) {
            return { error: null }
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
    }

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAdmin: profile?.role === 'admin',
        isStaff: profile?.role === 'staff' || profile?.role === 'admin',
        isDemoMode: checkIsDemoMode(),
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
