import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  const anon = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  const [p, c, i] = await Promise.all([
    anon.from('products').select('id').eq('status', 'active').limit(1),
    anon.from('categories').select('id').limit(1),
    anon.from('product_images').select('id').limit(1),
  ])

  const errors = [p.error?.message, c.error?.message, i.error?.message].filter(Boolean)
  const needsFix = errors.some(e => e?.includes('infinite recursion'))

  return NextResponse.json({
    healthy: errors.length === 0,
    needsFix,
    errors: { products: p.error?.message, categories: c.error?.message, images: i.error?.message },
    message: needsFix
      ? 'RLS infinite recursion detected. Go to Supabase Dashboard → SQL Editor and paste the content of sql/fix_rls_recursion.sql, then click Run.'
      : errors.length > 0
        ? `Unexpected errors: ${errors.join('; ')}`
        : 'All good! Storefront queries work.',
  })
}

export const dynamic = 'force-dynamic'
