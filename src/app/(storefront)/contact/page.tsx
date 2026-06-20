'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const fallbackContact = [
  { icon: Mail, label: 'Email', value: 'hello@store.com', href: 'mailto:hello@store.com' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: MapPin, label: 'Address', value: '123 Fashion Ave, New York, NY 10001' },
  { icon: Clock, label: 'Hours', value: 'Mon-Fri: 9AM-6PM EST' },
]

const iconMap: Record<string, { icon: typeof Mail; key: string }> = {
  email: { icon: Mail, key: 'contact_email' },
  phone: { icon: Phone, key: 'contact_phone' },
  address: { icon: MapPin, key: 'business_address' },
}

export default function ContactPage() {
  const [pageData, setPageData] = useState<{ title: string; content: string; image_url: string | null } | null>(null)
  const [siteSettings, setSiteSettings] = useState<{
    contact_email: string | null
    contact_phone: string | null
    business_address: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/pages/contact').then(r => r.ok ? r.json() : null),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
    ]).then(([page, settings]) => {
      if (page) setPageData(page)
      if (settings) setSiteSettings(settings)
    }).finally(() => setLoading(false))
  }, [])

  const contactInfo = siteSettings
    ? [
        { icon: Mail, label: 'Email', value: siteSettings.contact_email || fallbackContact[0].value, href: `mailto:${siteSettings.contact_email || fallbackContact[0].value}` },
        { icon: Phone, label: 'Phone', value: siteSettings.contact_phone || fallbackContact[1].value, href: `tel:${siteSettings.contact_phone?.replace(/\D/g, '') || fallbackContact[1].href?.replace('tel:', '')}` },
        { icon: MapPin, label: 'Address', value: siteSettings.business_address || fallbackContact[2].value },
        fallbackContact[3],
      ]
    : fallbackContact

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-16 py-16 md:py-24">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">{pageData?.title || 'Get in Touch'}</h1>
        <p className="text-sm text-[#6B6B6B]">We&apos;d love to hear from you. Drop us a message anytime.</p>
      </motion.div>

      {pageData?.content && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="prose prose-sm max-w-3xl mx-auto mb-12 text-[#6B6B6B]"
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      )}

      <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#16A34A]" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">Message Sent!</h3>
              <p className="text-sm text-[#6B6B6B]">We&apos;ll get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Name" id="name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Input label="Email" id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <Input label="Subject" id="subject" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              <div className="relative">
                <label htmlFor="message" className="absolute -top-2.5 left-3 text-xs text-[#2563EB] bg-white px-1 z-10">Message</label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-3 py-3 pt-4 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                />
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={sending} shimmer>
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </form>
          )}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="space-y-6"
        >
          {contactInfo.map(item => (
            <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[rgba(0,0,0,0.04)]">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/5 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-medium hover:text-[#2563EB] transition-colors">{item.value}</a>
                ) : (
                  <p className="text-sm font-medium">{item.value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="p-6 bg-[#2563EB]/5 rounded-2xl">
            <h3 className="font-medium mb-2">Prefer to browse first?</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">Check our FAQ for quick answers to common questions.</p>
            <a href="/faq" className="text-sm text-[#2563EB] font-medium hover:underline">Visit FAQ →</a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
