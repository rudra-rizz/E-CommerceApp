'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, StorefrontCustomer } from '@/types'

const LIGHT_SESSION_KEY = 'storefront_session'

interface LightSession {
  customerId: string
  email: string
  full_name: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  lightCustomer: StorefrontCustomer | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  lightSignIn: (email: string, fullName?: string, phone?: string, address?: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function getLightSession(): LightSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LIGHT_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setLightSession(session: LightSession) {
  localStorage.setItem(LIGHT_SESSION_KEY, JSON.stringify(session))
}

function clearLightSession() {
  localStorage.removeItem(LIGHT_SESSION_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [lightCustomer, setLightCustomer] = useState<StorefrontCustomer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLightCustomer = useCallback(async (customerId: string) => {
    const { data } = await supabase
      .from('storefront_customers')
      .select('*')
      .eq('id', customerId)
      .single()
    if (data) setLightCustomer(data)
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const session = getLightSession()
    if (session && !user) {
      fetchLightCustomer(session.customerId)
    }
  }, [user, fetchLightCustomer])

  const lightSignIn = async (email: string, fullName?: string, phone?: string, address?: string) => {
    try {
      const res = await fetch('/api/auth/light-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), full_name: fullName, phone, address }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        return { error: data.error || 'Failed to sign in' }
      }
      setLightCustomer(data.customer)
      setLightSession({
        customerId: data.customer.id,
        email: data.customer.email,
        full_name: data.customer.full_name,
      })
      return { error: null }
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'customer',
      })
    }
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    clearLightSession()
    setLightCustomer(null)
    await supabase.auth.signOut()
    setProfile(null)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
    else {
      const session = getLightSession()
      if (session) await fetchLightCustomer(session.customerId)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, lightCustomer, loading,
      signIn, signUp, signOut, signInWithGoogle, lightSignIn, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
