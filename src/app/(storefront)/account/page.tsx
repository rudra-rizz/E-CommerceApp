'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, MapPin, Heart, Package, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AccountDashboardPage() {
  const { user, profile, lightCustomer } = useAuth()
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const displayName = profile?.full_name || lightCustomer?.full_name || user?.email?.split('@')[0] || ''
  const displayEmail = user?.email || lightCustomer?.email || ''

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setRecentOrders(data as unknown as Order[])
      setLoading(false)
    }
    fetchOrders()
  }, [user])

  const quickLinks = [
    { href: '/account/orders', label: 'View Orders', icon: Package, color: 'bg-[#2563EB]' },
    { href: '/account/addresses', label: 'Manage Addresses', icon: MapPin, color: 'bg-[#16A34A]' },
    { href: '/account/wishlist', label: 'Wishlist', icon: Heart, color: 'bg-[#DC2626]' },
    { href: '/account/settings', label: 'Settings', icon: ShoppingBag, color: 'bg-[#F59E0B]' },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h2 className="font-serif text-2xl font-bold mb-1">
          Welcome{displayName ? ` back, ${displayName.split(' ')[0]}` : ''}!
        </h2>
        {displayEmail && <p className="text-sm text-[#6B6B6B]">{displayEmail}</p>}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="p-4 bg-white rounded-2xl border border-[rgba(0,0,0,0.04)] hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${link.color}/10 flex items-center justify-center mb-3`}>
                <link.icon className={`w-5 h-5 ${link.color.replace('bg-', 'text-')}`} />
              </div>
              <p className="text-sm font-medium">{link.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold">Recent Orders</h3>
          <Link href="/account/orders" className="text-sm text-[#2563EB] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#F5F5F0] rounded-xl animate-pulse" />)}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-[rgba(0,0,0,0.04)] hover:shadow-sm transition-shadow"
              >
                <div>
                  <p className="text-sm font-medium">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
                  <p className="text-xs text-[#6B6B6B]">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                  <span className={cn(
                    'text-[10px] uppercase font-semibold',
                    order.fulfillment_status === 'delivered' ? 'text-[#16A34A]' :
                    order.fulfillment_status === 'cancelled' ? 'text-[#DC2626]' :
                    'text-[#F59E0B]'
                  )}>
                    {order.fulfillment_status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl border border-[rgba(0,0,0,0.04)]">
            <Package className="w-8 h-8 mx-auto mb-2 text-[#6B6B6B]" />
            <p className="text-sm text-[#6B6B6B] mb-4">No orders yet.</p>
            <Link href="/products"><Button variant="primary" size="sm">Start Shopping</Button></Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
