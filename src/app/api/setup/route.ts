import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        hint: 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
        has_url: !!supabaseUrl,
        has_key: !!serviceKey,
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@store.com')
      .single()

    if (existingUser) {
      return NextResponse.json({ message: 'Admin account already exists. Login with admin@store.com / admin' })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@store.com',
      password: 'admin',
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (authData.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: 'admin@store.com',
          full_name: 'Admin',
          role: 'admin',
        })
    }

    return NextResponse.json({
      message: 'Admin account created! Login at /account with:',
      credentials: { email: 'admin@store.com', password: 'admin' },
      admin_url: '/admin',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
