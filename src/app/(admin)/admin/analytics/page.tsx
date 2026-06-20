'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays, parseISO } from 'date-fns'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, ShoppingCart, DollarSign, Users } from 'lucide-react'

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [ordersData, setOrdersData] = useState<any[]>([])
  const [topProductsRevenue, setTopProductsRevenue] = useState<any[]>([])
  const [topProductsUnits, setTopProductsUnits] = useState<any[]>([])
  const [topCategories, setTopCategories] = useState<any[]>([])
  const [customerData, setCustomerData] = useState<any[]>([])
  const [range, setRange] = useState<'30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [range])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const days = range === '30d' ? 30 : range === '90d' ? 90 : 365
      const since = subDays(new Date(), days).toISOString()

      const orders = await adminApi.select('orders', [{ method: 'gte', column: 'created_at', value: since }], { select: '*, items:order_items(*)' })

      const allOrders = (orders || []).filter((o: any) => o.payment_status === 'paid')

      const dailyRevenue: Record<string, number> = {}
      const dailyOrders: Record<string, number> = {}
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
        dailyRevenue[d] = 0
        dailyOrders[d] = 0
      }
      allOrders.forEach((o: any) => {
        const d = format(parseISO(o.created_at), 'yyyy-MM-dd')
        if (dailyRevenue[d] !== undefined) dailyRevenue[d] += o.total
        if (dailyOrders[d] !== undefined) dailyOrders[d] += 1
      })
      setRevenueData(Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue })))
      setOrdersData(Object.entries(dailyOrders).map(([date, orders]) => ({ date, orders })))

      const productRev: Record<string, { title: string; revenue: number; units: number }> = {}
      for (const order of allOrders) {
        const items = (order as any).items || []
        for (const item of items) {
          if (!productRev[item.product_id]) {
            productRev[item.product_id] = { title: item.title, revenue: 0, units: 0 }
          }
          productRev[item.product_id].revenue += item.line_total
          productRev[item.product_id].units += item.quantity
        }
      }
      const sorted = Object.values(productRev).sort((a, b) => b.revenue - a.revenue)
      setTopProductsRevenue(sorted.slice(0, 10))
      setTopProductsUnits([...sorted].sort((a, b) => b.units - a.units).slice(0, 10))

      const catSales: Record<string, number> = {}
      const products = await adminApi.select('products', [], { select: 'id, category:categories(name)' })
      const prodCatMap = new Map<string, string>((products || []).map((p: any) => [p.id, p.category?.name || 'Uncategorized']))
      for (const order of allOrders) {
        const items = (order as any).items || []
        for (const item of items) {
          catSales[prodCatMap.get(item.product_id) || 'Uncategorized'] += item.line_total || 0
        }
      }
      setTopCategories(Object.entries(catSales).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))

      const profiles = await adminApi.select('profiles', [{ method: 'eq', column: 'role', value: 'customer' }, { method: 'gte', column: 'created_at', value: since }], { select: 'created_at' })
      const dailyCustomers: Record<string, number> = {}
      for (let i = days - 1; i >= 0; i--) {
        dailyCustomers[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0
      }
      ;(profiles || []).forEach((p: any) => {
        const d = format(parseISO(p.created_at), 'yyyy-MM-dd')
        if (dailyCustomers[d] !== undefined) dailyCustomers[d]++
      })
      const cumulative = 0
      let cum = 0
      setCustomerData(Object.entries(dailyCustomers).map(([date, count]) => {
        cum += count
        return { date, customers: count, total: cum }
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
      </div>
    </div>
  )

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Analytics</h1>
        <div className="flex gap-1">
          {(['30d', '90d', '1y'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn('px-3 py-1 text-xs font-medium rounded-lg transition-all', range === r ? 'bg-[#2563EB] text-white' : 'text-[#6B6B6B] hover:bg-[#F5F5F0]')}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {revenueData.length === 0 && ordersData.length === 0 && topProductsRevenue.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[#6B6B6B]" />
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No Data Yet</h3>
          <p className="text-sm text-[#6B6B6B]">Analytics will appear once you start receiving orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {revenueData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Revenue Over Time</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => format(parseISO(v), 'MMM d')} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }} labelFormatter={(v) => format(parseISO(v), 'MMM d, yyyy')} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {ordersData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Orders Over Time</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => format(parseISO(v), 'MMM d')} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }} labelFormatter={(v) => format(parseISO(v), 'MMM d, yyyy')} />
                    <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topProductsRevenue.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Top Products by Revenue</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsRevenue} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => `$${v}`} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11, fill: '#6B6B6B' }} width={120} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }} />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topProductsUnits.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Top Products by Units Sold</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsUnits} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6B6B6B' }} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11, fill: '#6B6B6B' }} width={120} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }} />
                    <Bar dataKey="units" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {topCategories.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Top Categories</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {customerData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Customer Acquisition</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => format(parseISO(v), 'MMM d')} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }} labelFormatter={(v) => format(parseISO(v), 'MMM d, yyyy')} />
                    <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2} dot={false} name="Total Customers" />
                    <Line type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2} dot={false} name="New Customers" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
