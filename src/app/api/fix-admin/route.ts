import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', 'admin@store.com')

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'No admin profile found. Hit /api/setup first.' }, { status: 404 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'admin@store.com')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Admin role set successfully!',
      profiles_updated: profiles.map(p => ({ id: p.id, email: p.email, role: 'admin' })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
