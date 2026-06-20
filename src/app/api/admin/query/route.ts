import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Missing Supabase admin credentials')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function parseBody(req: NextRequest) {
  return req.clone().json().catch(() => ({}))
}

export async function POST(request: NextRequest) {
  try {
    const { table, action, data, filters, options } = await parseBody(request)
    const sb = serviceClient()

    if (action === 'select') {
      let query: any = sb.from(table).select(options?.select || '*')
      if (filters) {
        for (const f of filters) {
          if (f.method === 'eq') query = query.eq(f.column, f.value)
          else if (f.method === 'neq') query = query.neq(f.column, f.value)
          else if (f.method === 'gt') query = query.gt(f.column, f.value)
          else if (f.method === 'gte') query = query.gte(f.column, f.value)
          else if (f.method === 'lt') query = query.lt(f.column, f.value)
          else if (f.method === 'lte') query = query.lte(f.column, f.value)
          else if (f.method === 'in') query = query.in(f.column, f.value)
          else if (f.method === 'like') query = query.like(f.column, f.value)
          else if (f.method === 'ilike') query = query.ilike(f.column, f.value)
          else if (f.method === 'is') query = query.is(f.column, f.value)
          else if (f.method === 'or') {
            const orConditions = f.conditions.map((c: any) => `${c.column}.${c.method}.${c.value}`).join(',')
            query = query.or(orConditions)
          }
        }
      }
      if (options?.order) query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
      if (options?.range) {
        const rangeFrom = options.range.from
        const rangeTo = options.range.to
        query = query.range(rangeFrom, rangeTo)
      }
      if (options?.limit) query = query.limit(options.limit)
      if (options?.single) {
        const { data, error } = await query.single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }
      if (options?.maybeSingle) {
        const { data, error } = await query.maybeSingle()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }
      const { data, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'insert') {
      const body = data
      const { data: inserted, error } = await sb.from(table).insert(body).select(options?.select || '*')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(options?.single ? inserted?.[0] : inserted)
    }

    if (action === 'update') {
      let query: any = sb.from(table).update(data)
      if (filters) {
        for (const f of filters) {
          if (f.method === 'eq') query = query.eq(f.column, f.value)
        }
      }
      const { data: result, error } = await query.select(options?.select || '*')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(options?.single ? result?.[0] : result)
    }

    if (action === 'delete') {
      let query: any = sb.from(table).delete()
      if (filters) {
        for (const f of filters) {
          if (f.method === 'eq') query = query.eq(f.column, f.value)
        }
      }
      const { error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'rpc') {
      const rpcData = data
      const { data: rpcResult, error } = await sb.rpc(rpcData.functionName, rpcData.params)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(rpcResult)
    }

    if (action === 'count') {
      let query: any = sb.from(table).select('id', { count: 'exact', head: true })
      if (filters) {
        for (const f of filters) {
          if (f.method === 'eq') query = query.eq(f.column, f.value)
        }
      }
      const { count, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ count })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
