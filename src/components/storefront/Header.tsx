'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingBag, User, Menu, X, Heart, ChevronDown, LogIn } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useSignIn } from '@/context/SignInContext'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { itemCount, openCart } = useCart()
  const { user, profile, lightCustomer } = useAuth()
  const { openSignIn } = useSignIn()

  const displayName = profile?.full_name || lightCustomer?.full_name || user?.email?.split('@')[0] || ''
  const isSignedIn = !!(user || lightCustomer)

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-16">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#F5F5F0] transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#1A1A1A] hidden sm:block">
              STORE
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2563EB] transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl hover:bg-[#F5F5F0] transition-colors text-[#6B6B6B] hover:text-[#1A1A1A]"
            >
              <Search className="w-5 h-5" />
            </button>

            {isSignedIn ? (
              <>
                <Link
                  href="/account/wishlist"
                  className="p-2.5 rounded-xl hover:bg-[#F5F5F0] transition-colors text-[#6B6B6B] hover:text-[#1A1A1A] hidden sm:block"
                >
                  <Heart className="w-5 h-5" />
                </Link>
                <Link
                  href="/account"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#F5F5F0] transition-colors text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium max-w-[100px] truncate">{displayName}</span>
                </Link>
              </>
            ) : (
              <button
                onClick={openSignIn}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#F5F5F0] transition-colors text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-medium">Sign In</span>
              </button>
            )}

            <button
              onClick={openCart}
              className="p-2.5 rounded-xl hover:bg-[#F5F5F0] transition-colors text-[#6B6B6B] hover:text-[#1A1A1A] relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#2563EB] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-[#FAFAFA] p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <span className="font-serif text-xl font-bold">STORE</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#F5F5F0]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-all text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-[rgba(0,0,0,0.06)]" />
                {isSignedIn ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-all text-sm font-medium flex items-center gap-3"
                    >
                      <User className="w-4 h-4" />
                      Account
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-all text-sm font-medium flex items-center gap-3"
                    >
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileMenuOpen(false); openSignIn() }}
                    className="w-full px-4 py-3 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F5F0] transition-all text-sm font-medium flex items-center gap-3"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="bg-white border-b border-[rgba(0,0,0,0.06)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto max-w-[1440px] px-6 md:px-16 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search products..."
                    className="w-full h-12 pl-12 pr-12 bg-[#F5F5F0] rounded-xl border-none outline-none text-sm focus:ring-2 focus:ring-[#2563EB]"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`
                      }
                    }}
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[#E5E5E5] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  )
}
