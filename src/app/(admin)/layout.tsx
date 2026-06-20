'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Tag,
  Settings, Search, Image as ImageIcon, BarChart3, LogOut, Menu, X,
  ChevronDown, Store, Eye, EyeOff, Loader2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/seo', label: 'SEO', icon: Search },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || loading) return null

  if (!user) {
    return <AdminLogin />
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[rgba(0,0,0,0.06)] flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[rgba(0,0,0,0.06)]">
          <Store className="w-6 h-6 text-[#2563EB]" />
          <span className="font-semibold text-base">Admin Panel</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#2563EB]/10 text-[#2563EB]'
                    : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[rgba(0,0,0,0.06)]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A] transition-all"
          >
            <Store className="w-5 h-5" />
            <span>View Store</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F0]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-semibold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#1A1A1A]">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-[#6B6B6B]">{profile?.email || user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-[#6B6B6B] hover:bg-[#F5F5F0] hover:text-[#DC2626] transition-all"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function AdminLogin() {
  const { user, profile } = useAuth()
  const [email, setEmail] = useState('admin@store.com')
  const [password, setPassword] = useState('admin')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      window.location.href = '/admin'
    }
  }, [user, profile])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )
        await sb.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
        window.location.href = '/admin'
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-8">
      <div className="bg-white rounded-2xl shadow-lg border border-[rgba(0,0,0,0.06)] p-8 max-w-sm w-full">
        <div className="text-center mb-8">
          <Store className="w-10 h-10 mx-auto mb-3 text-[#2563EB]" />
          <h1 className="font-serif text-2xl">Admin</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 px-3 pr-10 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#DC2626] bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[rgba(0,0,0,0.06)] text-center">
          <p className="text-xs text-[#6B6B6B] mb-2">First time?</p>
          <a href="/api/setup" className="text-xs text-[#2563EB] hover:underline">
            Create default admin account
          </a>
          <p className="text-xs text-[#6B6B6B] mt-2">Default: admin@store.com / admin</p>
          <a href="/api/fix-admin" className="text-xs text-[#2563EB] hover:underline mt-2 inline-block">
            Fix admin role
          </a>
        </div>
      </div>
    </div>
  )
}
