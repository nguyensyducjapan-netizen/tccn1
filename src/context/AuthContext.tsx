import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) ensureProfile(session.user)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) ensureProfile(session.user)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const ensureProfile = async (user: User) => {
        // Check if profile exists
        const { data, error } = await supabase.from('profiles').select('id').eq('id', user.id).single()

        if (!data && !error) {
            // Logic hole: select single returns error if not found? 
            // Supabase select single returns error code PGRST116 if no rows
        }

        if (error && error.code === 'PGRST116') {
            // Profile missing, attempt to create it
            // Relying on the new INSERT policy
            await supabase.from('profiles').insert({
                id: user.id,
                full_name: user.user_metadata.full_name || user.email,
                avatar_url: user.user_metadata.avatar_url,
            })
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
