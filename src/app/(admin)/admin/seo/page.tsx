'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { adminApi } from '@/lib/admin-fetch'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

interface SeoSettings {
  id: string
  meta_title_template: string | null
  default_meta_description: string | null
  ga_tracking_id: string | null
  google_site_verification: string | null
  facebook_pixel_id: string | null
  og_default_image: string | null
  homepage_meta_title: string | null
  homepage_meta_description: string | null
  about_meta_title: string | null
  about_meta_description: string | null
  contact_meta_title: string | null
  contact_meta_description: string | null
  privacy_policy_meta_title: string | null
  privacy_policy_meta_description: string | null
  terms_of_service_meta_title: string | null
  terms_of_service_meta_description: string | null
  shipping_policy_meta_title: string | null
  shipping_policy_meta_description: string | null
  returns_policy_meta_title: string | null
  returns_policy_meta_description: string | null
  faq_meta_title: string | null
  faq_meta_description: string | null
}

const defaultSeo: SeoSettings = {
  id: '',
  meta_title_template: '%s | Store Name',
  default_meta_description: '',
  ga_tracking_id: '',
  google_site_verification: '',
  facebook_pixel_id: '',
  og_default_image: '',
  homepage_meta_title: '',
  homepage_meta_description: '',
  about_meta_title: '',
  about_meta_description: '',
  contact_meta_title: '',
  contact_meta_description: '',
  privacy_policy_meta_title: '',
  privacy_policy_meta_description: '',
  terms_of_service_meta_title: '',
  terms_of_service_meta_description: '',
  shipping_policy_meta_title: '',
  shipping_policy_meta_description: '',
  returns_policy_meta_title: '',
  returns_policy_meta_description: '',
  faq_meta_title: '',
  faq_meta_description: '',
}

export default function AdminSeo() {
  const { toast } = useToast()
  const [seo, setSeo] = useState<SeoSettings>(defaultSeo)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('global')

  useEffect(() => { loadSeo() }, [])

  async function loadSeo() {
    setLoading(true)
    try {
      const data = await adminApi.select('seo_settings', [], { single: true })
      if (data) setSeo(data as SeoSettings)
    } finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (seo.id) {
        await adminApi.update('seo_settings', seo, [{ method: 'eq', column: 'id', value: seo.id }])
      } else {
        await adminApi.insert('seo_settings', seo)
      }
      toast('SEO settings saved', 'success')
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const updateField = (field: keyof SeoSettings, value: string) => {
    setSeo(prev => ({ ...prev, [field]: value }))
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )

  const tabs = [
    { id: 'global', label: 'Global SEO' },
    { id: 'pages', label: 'Per-Page SEO' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">SEO Settings</h1>
        <Button onClick={handleSave} loading={saving} shimmer>Save Changes</Button>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('px-4 py-2 text-sm font-medium rounded-xl transition-all', activeTab === tab.id ? 'bg-[#2563EB] text-white' : 'bg-white text-[#6B6B6B] border border-[rgba(0,0,0,0.06)] hover:bg-[#F8F9FA]')}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
        {activeTab === 'global' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Global SEO Settings</h2>
            <Input label="Meta Title Template" value={seo.meta_title_template || ''} onChange={e => updateField('meta_title_template', e.target.value)} placeholder="%s | Store Name" />
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Default Meta Description</label>
              <textarea value={seo.default_meta_description || ''} onChange={e => updateField('default_meta_description', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <Input label="Google Analytics Tracking ID" value={seo.ga_tracking_id || ''} onChange={e => updateField('ga_tracking_id', e.target.value)} placeholder="G-XXXXXXXXXX" />
            <Input label="Google Search Console (Site Verification)" value={seo.google_site_verification || ''} onChange={e => updateField('google_site_verification', e.target.value)} />
            <Input label="Facebook Pixel ID" value={seo.facebook_pixel_id || ''} onChange={e => updateField('facebook_pixel_id', e.target.value)} />
            <Input label="OG Default Image URL" value={seo.og_default_image || ''} onChange={e => updateField('og_default_image', e.target.value)} />
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Per-Page SEO</h2>
            {[
              { key: 'homepage', label: 'Homepage' },
              { key: 'about', label: 'About' },
              { key: 'contact', label: 'Contact' },
              { key: 'privacy_policy', label: 'Privacy Policy' },
              { key: 'terms_of_service', label: 'Terms of Service' },
              { key: 'shipping_policy', label: 'Shipping Policy' },
              { key: 'returns_policy', label: 'Returns Policy' },
              { key: 'faq', label: 'FAQ' },
            ].map(page => (
              <div key={page.key} className="p-4 bg-[#F8F9FA] rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">{page.label}</h3>
                <Input label="Meta Title" value={(seo as any)[`${page.key}_meta_title`] || ''} onChange={e => updateField(`${page.key}_meta_title` as keyof SeoSettings, e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Meta Description</label>
                  <textarea value={(seo as any)[`${page.key}_meta_description`] || ''} onChange={e => updateField(`${page.key}_meta_description` as keyof SeoSettings, e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
