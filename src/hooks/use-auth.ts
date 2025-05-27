import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { siteUrl } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error signing in:', error)
      return { success: false, error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Add redirect URL for email verification
          emailRedirectTo: siteUrl
        }
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error signing up:', error)
      return { success: false, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      return { success: false, error }
    }
  }

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
}
