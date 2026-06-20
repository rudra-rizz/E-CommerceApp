'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Profile, Order, Address } from '@/types'

export default function AdminCustomerDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    if (params.id) loadCustomer()
  }, [params.id])

  async function loadCustomer() {
    setLoading(true)
    try {
      const profile = await adminApi.select('profiles', [{ method: 'eq', column: 'id', value: params.id }], { single: true })
      if (!profile) throw new Error('Customer not found')
      setCustomer(profile as Profile)

      const [ordersRes, addressesRes] = await Promise.all([
        adminApi.select('orders', [{ method: 'eq', column: 'user_id', value: params.id }], { order: { column: 'created_at', ascending: false } }),
        adminApi.select('addresses', [{ method: 'eq', column: 'user_id', value: params.id }]),
      ])
      setOrders((ordersRes || []) as Order[])
      setAddresses((addressesRes || []) as Address[])
    } catch (err: any) {
      toast(err.message || 'Failed to load customer', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await adminApi.update('profiles', { full_name: customer?.full_name }, [{ method: 'eq', column: 'id', value: params.id }])
      toast('Notes updated', 'success')
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )

  if (!customer) return <div className="text-center py-12 text-[#6B6B6B]">Customer not found</div>

  const totalSpent = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[#F5F5F0]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[#1A1A1A]">Customer Details</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-semibold text-xl">
            {(customer.full_name || customer.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{customer.full_name || 'No name'}</h2>
            <p className="text-sm text-[#6B6B6B]">Joined {format(parseISO(customer.created_at), 'MMMM yyyy')}</p>
          </div>
          <div className="ml-auto flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{orders.length}</p>
              <p className="text-xs text-[#6B6B6B]">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-[#6B6B6B]">Total Spent</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-[#6B6B6B]">
            <Mail className="w-4 h-4" /> {customer.email}
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 text-[#6B6B6B]">
              <Phone className="w-4 h-4" /> {customer.phone}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Order History</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 20).map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-xl cursor-pointer hover:bg-[#F0F0F0]"
                    onClick={() => router.push('/admin/orders/' + order.id)}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]"># {order.order_number}</p>
                      <p className="text-xs text-[#6B6B6B]">{format(parseISO(order.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{order.fulfillment_status}</span>
                      <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Saved Addresses</h2>
            {addresses.length === 0 ? (
              <p className="text-sm text-[#6B6B6B]">No saved addresses</p>
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="p-3 bg-[#F8F9FA] rounded-xl text-sm">
                    <p className="font-medium text-[#1A1A1A]">{addr.full_name}</p>
                    <p className="text-[#6B6B6B]">{addr.address_line1}</p>
                    {addr.address_line2 && <p className="text-[#6B6B6B]">{addr.address_line2}</p>}
                    <p className="text-[#6B6B6B]">{addr.city}, {addr.state} {addr.zip}</p>
                    <p className="text-[#6B6B6B]">{addr.phone}</p>
                    {addr.is_default && <span className="text-xs font-medium text-[#2563EB]">Default</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Admin Notes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Add internal notes..."
            />
            <Button size="sm" className="mt-2" onClick={saveNotes} loading={savingNotes}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
