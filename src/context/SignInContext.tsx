'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { SignInModal } from '@/components/storefront/SignInModal'

interface SignInContextType {
  openSignIn: () => void
}

const SignInContext = createContext<SignInContextType | null>(null)

export function SignInProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openSignIn = useCallback(() => setOpen(true), [])

  return (
    <SignInContext.Provider value={{ openSignIn }}>
      {children}
      <SignInModal isOpen={open} onClose={() => setOpen(false)} />
    </SignInContext.Provider>
  )
}

export function useSignIn() {
  const context = useContext(SignInContext)
  if (!context) throw new Error('useSignIn must be used within SignInProvider')
  return context
}
