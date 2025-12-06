import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, signOut } from '../services/supabase' // convert services to TS next
import type { Session, User } from '@supabase/supabase-js'

type AuthContextValue = {
  user: User | null
  loading: boolean
  session: Session | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null)
      setUser(sess?.user ?? null)
      setLoading(false)
    })

    return () => subscription?.subscription?.unsubscribe?.()
  }, [])

  const logout = async () => {
    const { error } = await signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, session, logout }}>
      {children}
    </AuthContext.Provider>
  )
}