'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, Printer, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Order, OrderItem, OrderTimeline } from '@/types'

const fulfillmentStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function AdminOrderDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [timeline, setTimeline] = useState<OrderTimeline[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [tracking, setTracking] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (params.id) loadOrder()
  }, [params.id])

  async function loadOrder() {
    setLoading(true)
    try {
      const orderData = await adminApi.select('orders', [{ method: 'eq', column: 'id', value: params.id }], { single: true })
      if (!orderData) throw new Error('Order not found')
      setOrder(orderData)
      setTracking(orderData.tracking_number || '')
      setNotes(orderData.notes || '')

      const [items, timeline] = await Promise.all([
        adminApi.select('order_items', [{ method: 'eq', column: 'order_id', value: params.id }]),
        adminApi.select('order_timeline', [{ method: 'eq', column: 'order_id', value: params.id }], { order: { column: 'created_at', ascending: false } }),
      ])
      setItems((items || []) as OrderItem[])
      setTimeline((timeline || []) as OrderTimeline[])
    } catch (err: any) {
      toast(err.message || 'Failed to load order', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    if (!order) return
    setUpdating(true)
    try {
      await adminApi.update('orders', { fulfillment_status: newStatus }, [{ method: 'eq', column: 'id', value: order.id }])
      await adminApi.insert('order_timeline', {
        order_id: order.id,
        status: newStatus,
        note: null,
      })
      toast(('Status updated to ' + newStatus), 'success')
      loadOrder()
    } catch (err: any) {
      toast(err.message || 'Update failed', 'error')
    } finally {
      setUpdating(false)
    }
  }

  async function updateTracking() {
    if (!order) return
    setUpdating(true)
    try {
      await adminApi.update('orders', { tracking_number: tracking }, [{ method: 'eq', column: 'id', value: order.id }])
      toast('Tracking updated', 'success')
    } catch (err: any) {
      toast(err.message || 'Update failed', 'error')
    } finally {
      setUpdating(false)
    }
  }

  async function updateNotes() {
    if (!order) return
    setUpdating(true)
    try {
      await adminApi.update('orders', { notes }, [{ method: 'eq', column: 'id', value: order.id }])
      toast('Notes saved', 'success')
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally {
      setUpdating(false)
    }
  }

  function printPackingSlip() {
    window.print()
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )

  if (!order) return <div className="text-center py-12 text-[#6B6B6B]">Order not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[#F5F5F0]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Order #{order.order_number}</h1>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', order.fulfillment_status === 'delivered' ? 'bg-green-100 text-green-700' : order.fulfillment_status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700')}>
            {order.fulfillment_status}
          </span>
        </div>
        <Button variant="outline" onClick={printPackingSlip}>
          <Printer className="w-4 h-4 mr-2" /> Print Packing Slip
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Customer</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-semibold">
                {order.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{order.email}</p>
                <p className="text-xs text-[#6B6B6B]">Customer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#F8F9FA] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                  <span className="text-xs font-medium text-[#6B6B6B]">Shipping Address</span>
                </div>
                <p className="text-sm text-[#1A1A1A]">{order.shipping_address?.full_name}</p>
                <p className="text-sm text-[#1A1A1A]">{order.shipping_address?.address_line1}</p>
                {order.shipping_address?.address_line2 && <p className="text-sm text-[#1A1A1A]">{order.shipping_address.address_line2}</p>}
                <p className="text-sm text-[#1A1A1A]">{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}</p>
                <p className="text-sm text-[#1A1A1A]">{order.shipping_address?.phone}</p>
              </div>
              <div className="p-3 bg-[#F8F9FA] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                  <span className="text-xs font-medium text-[#6B6B6B]">Billing Address</span>
                </div>
                <p className="text-sm text-[#1A1A1A]">{order.billing_address?.full_name}</p>
                <p className="text-sm text-[#1A1A1A]">{order.billing_address?.address_line1}</p>
                {order.billing_address?.address_line2 && <p className="text-sm text-[#1A1A1A]">{order.billing_address.address_line2}</p>}
                <p className="text-sm text-[#1A1A1A]">{order.billing_address?.city}, {order.billing_address?.state} {order.billing_address?.zip}</p>
                <p className="text-sm text-[#1A1A1A]">{order.billing_address?.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Items</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-[#F5F5F0] flex-shrink-0 overflow-hidden">
                    <Package className="w-6 h-6 m-auto text-[#6B6B6B]" style={{ marginTop: 12 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.title}</p>
                    {item.variant_info && Object.keys(item.variant_info).length > 0 && (
                      <p className="text-xs text-[#6B6B6B]">{Object.entries(item.variant_info).map(([k, v]) => k + ': ' + v).join(', ')}</p>
                    )}
                    <p className="text-xs text-[#6B6B6B]">Qty: {item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.line_total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Order Timeline</h2>
            <div className="relative">
              {timeline.length === 0 ? (
                <p className="text-sm text-[#6B6B6B]">No timeline events</p>
              ) : (
                <div className="space-y-0">
                  {timeline.map((event, i) => {
                    const Icon = statusIcons[event.status] || Clock
                    return (
                      <div key={event.id} className="flex gap-3 pb-4 relative">
                        {i < timeline.length - 1 && (
                          <div className="absolute left-[15px] top-7 bottom-0 w-[2px] bg-[rgba(0,0,0,0.08)]" />
                        )}
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', event.status === 'delivered' ? 'bg-green-100' : event.status === 'shipped' ? 'bg-indigo-100' : event.status === 'processing' ? 'bg-blue-100' : event.status === 'cancelled' ? 'bg-gray-100' : 'bg-yellow-100')}>
                          <Icon className={cn('w-4 h-4', event.status === 'delivered' ? 'text-green-700' : event.status === 'shipped' ? 'text-indigo-700' : event.status === 'processing' ? 'text-blue-700' : event.status === 'cancelled' ? 'text-gray-700' : 'text-yellow-700')} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A] capitalize">{event.status}</p>
                          {event.note && <p className="text-xs text-[#6B6B6B]">{event.note}</p>}
                          <p className="text-xs text-[#6B6B6B]">{format(parseISO(event.created_at), 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Shipping</span>
                <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Discount</span>
                  <span className="font-medium text-[#16A34A]">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Tax</span>
                <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="border-t border-[rgba(0,0,0,0.06)] pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Status</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                  {order.payment_status}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Payment ID</span>
                  <span className="font-medium text-xs">{order.razorpay_payment_id}</span>
                </div>
              )}
              {order.coupon_code && (
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Coupon</span>
                  <span className="font-medium">{order.coupon_code}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Fulfillment</h2>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Status</label>
              <select
                value={order.fulfillment_status}
                onChange={e => updateStatus(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                disabled={updating}
              >
                {fulfillmentStatuses.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Tracking Number</label>
              <div className="flex gap-2">
                <Input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Enter tracking..." />
                <Button size="sm" variant="secondary" onClick={updateTracking} loading={updating}>Save</Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Admin Notes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Add internal notes..."
            />
            <Button size="sm" onClick={updateNotes} loading={updating}>Save Notes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
