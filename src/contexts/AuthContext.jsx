import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, checkIsDemoMode, demoData } from '../lib/supabase'

const AuthContext = createContext({})

// Demo user emails - these always use demo mode regardless of Supabase config
const DEMO_EMAILS = [
    'max.finkgrafe@player.com',
    'tim.lemperle@player.com',
    'max.bisinger@warubi-sports.com',
    'thomas.ellinger@warubi-sports.com',
    'demo.player@itp.com'
]

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing session
        // First check if there's a demo user in localStorage
        const savedDemoUser = localStorage.getItem('itp_demo_user')
        if (savedDemoUser) {
            const parsedUser = JSON.parse(savedDemoUser)
            setUser(parsedUser)
            setProfile(parsedUser)
            setLoading(false)
            return
        }

        if (checkIsDemoMode()) {
            // Pure demo mode with no saved user
            setLoading(false)
        } else {
            // Supabase mode
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
        }
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
        // Check if this is a demo email - always use demo mode for demo accounts
        const isDemoEmail = DEMO_EMAILS.includes(email.toLowerCase())

        if (checkIsDemoMode() || isDemoEmail) {
            // Demo mode: simple email/password check
            const demoUser = demoData.users.find(u => u.email.toLowerCase() === email.toLowerCase())
            if (demoUser && (password === 'ITP2024' || password === 'Demo2024')) {
                setUser(demoUser)
                setProfile(demoUser)
                localStorage.setItem('itp_demo_user', JSON.stringify(demoUser))
                return { error: null }
            }
            return { error: { message: 'Invalid credentials. Try:\n• Player: max.finkgrafe@player.com / ITP2024\n• Staff: max.bisinger@warubi-sports.com / ITP2024' } }
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error }
    }

    const signUp = async (email, password, metadata = {}) => {
        if (checkIsDemoMode()) {
            // Demo mode: create new user in memory
            const newUser = {
                id: `user-${Date.now()}`,
                email,
                role: metadata.role || 'player',
                first_name: metadata.first_name || '',
                last_name: metadata.last_name || '',
            }
            demoData.users.push(newUser)
            setUser(newUser)
            setProfile(newUser)
            localStorage.setItem('itp_demo_user', JSON.stringify(newUser))
            return { error: null }
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        })
        return { error }
    }

    const signOut = async () => {
        // Always clear demo user if present
        const hadDemoUser = localStorage.getItem('itp_demo_user') !== null
        localStorage.removeItem('itp_demo_user')

        if (hadDemoUser || checkIsDemoMode()) {
            setUser(null)
            setProfile(null)
            return { error: null }
        }

        const { error } = await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        return { error }
    }

    const resetPassword = async (email) => {
        if (checkIsDemoMode() || DEMO_EMAILS.includes(email.toLowerCase())) {
            return { error: null, message: 'Demo mode: Password reset email would be sent' }
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
