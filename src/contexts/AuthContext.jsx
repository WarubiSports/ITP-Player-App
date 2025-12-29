import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isDemoMode, demoData } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for existing session
        if (isDemoMode) {
            // Demo mode: check localStorage
            const savedUser = localStorage.getItem('itp_demo_user')
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser)
                setUser(parsedUser)
                setProfile(parsedUser)
            }
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
        if (isDemoMode) {
            // Demo mode: simple email/password check
            const demoUser = demoData.users.find(u => u.email === email)
            if (demoUser && password === 'ITP2024') {
                setUser(demoUser)
                setProfile(demoUser)
                localStorage.setItem('itp_demo_user', JSON.stringify(demoUser))
                return { error: null }
            }
            return { error: { message: 'Invalid credentials. Try max.bisinger@warubi-sports.com / ITP2024' } }
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error }
    }

    const signUp = async (email, password, metadata = {}) => {
        if (isDemoMode) {
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
        if (isDemoMode) {
            setUser(null)
            setProfile(null)
            localStorage.removeItem('itp_demo_user')
            return { error: null }
        }

        const { error } = await supabase.auth.signOut()
        return { error }
    }

    const resetPassword = async (email) => {
        if (isDemoMode) {
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
        isDemoMode,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
