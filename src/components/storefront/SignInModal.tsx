'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, MapPin, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { lightSignIn } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast('Please enter your email', 'error')
      return
    }
    setSubmitting(true)
    const { error } = await lightSignIn(email.trim(), fullName.trim() || undefined, phone.trim() || undefined, address.trim() || undefined)
    setSubmitting(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast('Welcome! Account created.', 'success')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#F5F5F0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-xl font-bold mb-1">Sign In</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">Enter your details to create or access your account.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5 block">
                  Email <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full h-11 pl-10 pr-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-11 pl-10 pr-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5 block">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full h-11 pl-10 pr-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1.5 block">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#6B6B6B]" />
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Main St, City, Country"
                    rows={2}
                    className="w-full pl-10 pr-3 pt-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full" type="submit" loading={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-xs text-[#6B6B6B] text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
