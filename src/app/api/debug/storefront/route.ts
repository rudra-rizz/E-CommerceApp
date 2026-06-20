import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  try {
    const anonClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    const [products, categories, images] = await Promise.all([
      anonClient.from('products').select('*').eq('status', 'active').limit(1),
      anonClient.from('categories').select('*').limit(1),
      anonClient.from('product_images').select('*').limit(1),
    ])

    return NextResponse.json({
      url_configured: !!url,
      key_configured: !!key,
      products: { count: products.data?.length ?? 0, error: products.error?.message || null },
      categories: { count: categories.data?.length ?? 0, error: categories.error?.message || null },
      images: { count: images.data?.length ?? 0, error: images.error?.message || null },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
