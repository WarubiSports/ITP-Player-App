import { createContext, useContext, useState, useEffect } from 'react'
// v2 - Added player_id to profile
import { supabase, checkIsDemoMode, demoData, checkConnection, isConnectionHealthy } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// Demo password for all demo accounts
const DEMO_PASSWORD = 'ITP2024'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            // Check for demo user first
            const demoUser = localStorage.getItem('itp_demo_user')
            if (demoUser) {
                const parsed = JSON.parse(demoUser)
                setUser(parsed)
                setProfile(parsed)
                setLoading(false)
                return
            }

            // Check Supabase connection health first
            await checkConnection()

            // Only try Supabase if connection is healthy
            if (isConnectionHealthy()) {
                // Check for existing Supabase session
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchProfile(session.user.id)
                }
            }
            setLoading(false)
        }

        initAuth()

        // Only set up auth listener if Supabase might be healthy
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isConnectionHealthy()) {
                setUser(session?.user ?? null)
                if (session?.user) {
                    fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        // Also fetch the linked player record to get player_id
        const { data: playerData } = await supabase
            .from('players')
            .select('id, first_name, last_name, photo_url')
            .eq('user_id', userId)
            .single()

        // Merge player info into profile
        const mergedProfile = {
            ...profileData,
            player_id: playerData?.id || null,
            // Use player photo if available
            photo_url: playerData?.photo_url || profileData?.photo_url,
            // Use player name if profile name is missing
            first_name: profileData?.first_name || playerData?.first_name,
            last_name: profileData?.last_name || playerData?.last_name,
        }

        setProfile(mergedProfile)
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

    // Magic Link sign-in - easiest for players
    const signInWithMagicLink = async (email) => {
        // In demo mode, simulate magic link sent
        if (checkIsDemoMode()) {
            // Check if email exists in demo users
            const demoUser = demoData.users.find(u => u.email.toLowerCase() === email.toLowerCase())
            if (demoUser) {
                return { error: null, message: 'Demo mode: Use password ITP2024 to login' }
            }
            return { error: { message: 'Email not found in demo mode' } }
        }

        // Check if email exists in players table
        const { data: player } = await supabase
            .from('players')
            .select('id, email, first_name')
            .eq('email', email.toLowerCase())
            .single()

        if (!player) {
            return { error: { message: 'No player account found with this email. Contact staff if you need access.' } }
        }

        // Send magic link - will create auth user if doesn't exist
        const { error } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase(),
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`,
                shouldCreateUser: true,
            }
        })

        if (error) {
            return { error }
        }

        return { error: null, message: `Login link sent to ${email}. Check your inbox!` }
    }

    const value = {
        user,
        profile,
        loading,
        signIn,
        signInWithMagicLink,
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
