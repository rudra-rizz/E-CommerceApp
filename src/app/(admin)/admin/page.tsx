'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, ShoppingCart, Users as UsersIcon, TrendingUp, Package, AlertTriangle,
  ArrowUp, ArrowDown
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { format, subDays, startOfDay, parseISO } from 'date-fns'
import { adminApi } from '@/lib/admin-fetch'
import { formatCurrency, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order, Product } from '@/types'

function CountUp({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      setDisplay(Math.floor(progress * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])
  return <span>{display.toLocaleString()}</span>
}

function KpiCard({ title, value, prefix, icon: Icon, trend, trendLabel }: {
  title: string; value: number; prefix?: string; icon: any; trend?: number; trendLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#6B6B6B]">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-[#2563EB]" />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#1A1A1A]">
        {prefix}{value > 0 ? <CountUp value={value} /> : '0'}
      </div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]')}>
          {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}% {trendLabel || 'vs last period'}
        </div>
      )}
    </motion.div>
  )
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [customersCount, setCustomersCount] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [revenueRange, setRevenueRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [revenueRange])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const days = revenueRange === '7d' ? 7 : revenueRange === '30d' ? 30 : revenueRange === '90d' ? 90 : 365
      const since = subDays(new Date(), days).toISOString()

      const [orders, productsRes, customerCount] = await Promise.all([
        adminApi.select('orders', [{ method: 'gte', column: 'created_at', value: since }]),
        adminApi.select('products', [{ method: 'lte', column: 'stock_quantity', value: 10 }, { method: 'neq', column: 'status', value: 'draft' }]),
        adminApi.count('profiles', [{ method: 'eq', column: 'role', value: 'customer' }]),
      ])

      const orderList = (orders || []) as Order[]
      const paidOrders = orderList.filter(o => o.payment_status === 'paid')
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
      setRevenue(totalRevenue)
      setOrdersCount(orderList.length)
      setCustomersCount(customerCount.count || 0)
      setAvgOrderValue(paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0)
      setLowStock((productsRes || []) as Product[])

      const dailyRevenue: Record<string, number> = {}
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
        dailyRevenue[d] = 0
      }
      paidOrders.forEach(o => {
        const d = format(parseISO(o.created_at), 'yyyy-MM-dd')
        if (dailyRevenue[d] !== undefined) dailyRevenue[d] += o.total
      })
      setRevenueData(Object.entries(dailyRevenue).map(([date, rev]) => ({ date, revenue: rev })))

      setRecentOrders(orderList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10))

      const productSales: Record<string, { title: string; revenue: number; units: number }> = {}
      for (const order of paidOrders) {
        const items = await adminApi.select('order_items', [{ method: 'eq', column: 'order_id', value: order.id }])
        if (items) {
          for (const item of items as any[]) {
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = { title: item.title, revenue: 0, units: 0 }
            }
            productSales[item.product_id].revenue += item.line_total
            productSales[item.product_id].units += item.quantity
          }
        }
      }
      setTopProducts(Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10))
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={revenue} prefix="$" icon={DollarSign} />
        <KpiCard title="Total Orders" value={ordersCount} icon={ShoppingCart} />
        <KpiCard title="Total Customers" value={customersCount} icon={UsersIcon} />
        <KpiCard title="Avg Order Value" value={Math.round(avgOrderValue)} prefix="$" icon={TrendingUp} />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1A1A1A]">Revenue</h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d', '1y'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRevenueRange(r)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-all',
                  revenueRange === r ? 'bg-[#2563EB] text-white' : 'text-[#6B6B6B] hover:bg-[#F5F5F0]'
                )}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => format(parseISO(v), 'MMM d')} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelFormatter={(v) => format(parseISO(v), 'MMM d, yyyy')}
              />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-[#6B6B6B]">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">#{order.order_number}</p>
                    <p className="text-xs text-[#6B6B6B]">{format(parseISO(order.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[order.payment_status])}>
                      {order.payment_status}
                    </span>
                    <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
          <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#6B6B6B]">No sales data</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.slice(0, 7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B6B6B' }} tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="title" type="category" tick={{ fontSize: 11, fill: '#6B6B6B' }} width={120} tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-base font-semibold text-[#1A1A1A]">Low Stock Alerts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                <Package className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{p.title}</p>
                  <p className="text-xs text-yellow-600">Stock: {p.stock_quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
