'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile } from '@/types'

export default function AdminCustomers() {
  const router = useRouter()
  const [customers, setCustomers] = useState<(Profile & { order_count?: number; total_spent?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const perPage = 20

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const profiles = await adminApi.select('profiles', [{ method: 'eq', column: 'role', value: 'customer' }], { order: { column: 'created_at', ascending: false } })
      const list = (profiles || []) as Profile[]

      const enriched = await Promise.all(
        list.map(async (p) => {
          const { count } = await adminApi.count('orders', [{ method: 'eq', column: 'user_id', value: p.id }])
          const paidOrders = await adminApi.select('orders', [
            { method: 'eq', column: 'user_id', value: p.id },
            { method: 'eq', column: 'payment_status', value: 'paid' },
          ], { select: 'total' })
          const totalSpent = (paidOrders || []).reduce((sum: number, o: any) => sum + o.total, 0)
          return { ...p, order_count: count || 0, total_spent: totalSpent }
        })
      )
      setCustomers(enriched)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...customers]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c => c.email.toLowerCase().includes(s) || (c.full_name || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const aVal = (a as any)[sortField]
      const bVal = (b as any)[sortField]
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
    })
    return list
  }, [customers, search, sortField, sortDir])

  const paginated = useMemo(() => filtered.slice(page * perPage, (page + 1) * perPage), [filtered, page])
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Customers</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search customers..."
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)]">
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Customer</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('order_count')}>
                  Orders {sortField === 'order_count' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('total_spent')}>
                  Total Spent {sortField === 'total_spent' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                  Joined {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((customer) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-semibold text-sm">
                        {(customer.full_name || customer.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{customer.full_name || 'No name'}</p>
                        <p className="text-xs text-[#6B6B6B]">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-medium">{customer.order_count}</td>
                  <td className="p-3 font-semibold">{formatCurrency(customer.total_spent || 0)}</td>
                  <td className="p-3 text-[#6B6B6B]">{format(parseISO(customer.created_at), 'MMM d, yyyy')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginated.length === 0 && (
          <div className="text-center py-12 text-[#6B6B6B]">No customers found</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[#F5F5F0] disabled:opacity-40">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} className={cn('px-3 py-1.5 text-sm rounded-lg', page === i ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F5F5F0]')}>{i + 1}</button>
          ))}
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded-lg hover:bg-[#F5F5F0] disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
