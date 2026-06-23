import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('/api/settings supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || {}, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
  } catch (err: any) {
    console.error('/api/settings unexpected error:', err.message)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
