'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, ShoppingCart, ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order } from '@/types'

const paymentColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
}

const fulfillmentColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const perPage = 20

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await adminApi.select('orders', [], { order: { column: 'created_at', ascending: false } })
      setOrders((data || []) as Order[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...orders]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(s) ||
        o.email.toLowerCase().includes(s)
      )
    }
    if (statusFilter) list = list.filter(o => o.fulfillment_status === statusFilter)
    if (paymentFilter) list = list.filter(o => o.payment_status === paymentFilter)
    list.sort((a, b) => {
      const aVal = (a as any)[sortField]
      const bVal = (b as any)[sortField]
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
    })
    return list
  }, [orders, search, statusFilter, paymentFilter, sortField, sortDir])

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
      <h1 className="text-xl font-bold text-[#1A1A1A]">Orders</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search order # or email..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={e => { setPaymentFilter(e.target.value); setPage(0) }}
          className="h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="">All Payment</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)]">
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('order_number')}>
                  Order # {sortField === 'order_number' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                  Date {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Customer</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Items</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('total')}>
                  Total {sortField === 'total' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Payment</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <td className="p-3 font-medium text-[#2563EB]">#{order.order_number}</td>
                  <td className="p-3 text-[#6B6B6B]">{format(parseISO(order.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-3 text-[#1A1A1A]">{order.email}</td>
                  <td className="p-3 text-[#6B6B6B]">{order.items?.length || '-'}</td>
                  <td className="p-3 font-semibold">{formatCurrency(order.total)}</td>
                  <td className="p-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', paymentColors[order.payment_status])}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', fulfillmentColors[order.fulfillment_status])}>
                      {order.fulfillment_status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginated.length === 0 && (
          <div className="text-center py-12 text-[#6B6B6B]">No orders found</div>
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
