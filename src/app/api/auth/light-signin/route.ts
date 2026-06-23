import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { email, full_name, phone, address } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: existing } = await adminClient
      .from('storefront_customers')
      .select('id, email, full_name, phone, address, created_at, updated_at')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existing) {
      const { data: updated, error: updateError } = await adminClient
        .from('storefront_customers')
        .update({
          full_name: full_name || existing.full_name,
          phone: phone || existing.phone,
          address: address || existing.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, email, full_name, phone, address, created_at, updated_at')
        .single()

      if (updateError) throw updateError
      return NextResponse.json({ customer: updated, isNew: false })
    }

    const { data: customer, error: insertError } = await adminClient
      .from('storefront_customers')
      .insert({
        email: email.trim().toLowerCase(),
        full_name: full_name || null,
        phone: phone || null,
        address: address || null,
      })
      .select('id, email, full_name, phone, address, created_at, updated_at')
      .single()

    if (insertError) throw insertError
    return NextResponse.json({ customer, isNew: true })
  } catch (err) {
    console.error('Light sign-in error:', err)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
