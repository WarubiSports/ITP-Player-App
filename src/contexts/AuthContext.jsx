import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, checkConnection } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            // Clear any old demo user data
            localStorage.removeItem('itp_demo_user')

            // Check Supabase connection health
            await checkConnection()

            // Check for existing Supabase session
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            }
            setLoading(false)
        }

        initAuth()

        // Set up auth listener
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
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        // Also fetch the linked player record to get player_id
        let { data: playerData } = await supabase
            .from('players')
            .select('id, first_name, last_name, photo_url, email')
            .eq('user_id', userId)
            .single()

        // Fallback: if no user_id match, try matching by email and link them
        if (!playerData && profileData?.email) {
            const { data: playerByEmail } = await supabase
                .from('players')
                .select('id, first_name, last_name, photo_url, email')
                .eq('email', profileData.email.toLowerCase())
                .single()

            if (playerByEmail) {
                // Link this auth user to the player record
                await supabase
                    .from('players')
                    .update({ user_id: userId })
                    .eq('id', playerByEmail.id)

                playerData = playerByEmail
            }
        }

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
        // Production: Only use Supabase auth
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            return { error }
        }
        return { error: null }
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
    }

    // Magic Link sign-in - easiest for players
    const signInWithMagicLink = async (email) => {
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
        isDemoMode: false,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
