import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('site_settings')
      .select('contact_email, contact_phone, business_address, social_instagram, social_facebook, social_twitter, site_name')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
