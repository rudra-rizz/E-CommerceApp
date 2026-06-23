'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CreditCard, Truck, User, MapPin } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/toast'
import { motion } from 'framer-motion'

interface CheckoutForm {
  full_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip: string
  country: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { user, lightCustomer, lightSignIn } = useAuth()
  const { toast } = useToast()

  const [form, setForm] = useState<CheckoutForm>({
    full_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  })
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({})
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod')
  const [processing, setProcessing] = useState(false)

  const shippingCost = 0
  const tax = subtotal * 0.08
  const total = subtotal + shippingCost + tax

  useEffect(() => {
    setForm(f => ({ ...f, email: user?.email || lightCustomer?.email || '' }))
  }, [user, lightCustomer])

  const validate = () => {
    const errs: Partial<CheckoutForm> = {}
    if (!form.full_name.trim()) errs.full_name = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email'
    if (!form.phone.trim()) errs.phone = 'Required'
    if (!form.address_line1.trim()) errs.address_line1 = 'Required'
    if (!form.city.trim()) errs.city = 'Required'
    if (!form.state.trim()) errs.state = 'Required'
    if (!form.zip.trim()) errs.zip = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const placeOrder = async () => {
    setProcessing(true)
    try {
      // Step 1: Auto-create account if not already signed in
      if (!user && !lightCustomer) {
        const { error: signInError } = await lightSignIn(form.email.trim(), form.full_name.trim(), form.phone.trim(), `${form.address_line1}, ${form.city}, ${form.state} ${form.zip}`)
        if (signInError) {
          toast(signInError, 'error')
          setProcessing(false)
          return
        }
        toast('Account created!', 'success')
      }

      // Step 2: Create order
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          items: items.map(i => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            variant_info: i.variant_label ? { label: i.variant_label } : null,
            quantity: i.quantity,
          })),
          shipping_address: form,
          billing_address: form,
          shipping_method: 'Standard Shipping',
          shipping_cost: shippingCost,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.order) throw new Error(data.error || 'Failed to create order')

      const order = data.order

      // Step 3: Handle payment
      if (paymentMethod === 'cod') {
        clearCart()
        toast('Order placed! Pay on delivery.', 'success')
        router.push(`/order-confirmation/${order.id}`)
        return
      }

      // Card/Razorpay payment
      const paymentRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: order.total, orderId: order.id }),
      })
      const paymentData = await paymentRes.json()

      if (paymentData.razorpayOrderId) {
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_PUBLISHABLE_KEY,
          amount: paymentData.amount,
          currency: 'INR',
          name: 'STORE',
          description: `Order ${order.order_number}`,
          order_id: paymentData.razorpayOrderId,
          handler: async function (response: any) {
            await fetch('/api/orders', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, payment_status: 'paid', razorpay_payment_id: response.razorpay_payment_id }),
            })
            clearCart()
            router.push(`/order-confirmation/${order.id}`)
          },
          prefill: { name: form.full_name, email: form.email, contact: form.phone },
          theme: { color: '#2563EB' },
        })
        rzp.on('payment.failed', async () => {
          await fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id, payment_status: 'failed' }),
          })
          toast('Payment failed. Please try again.', 'error')
        })
        rzp.open()
      } else {
        clearCart()
        router.push(`/order-confirmation/${order.id}`)
      }
    } catch (err) {
      toast('Failed to place order', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const updateField = (field: keyof CheckoutForm, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }))
  }

  if (items.length === 0) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mx-auto max-w-[1440px] px-6 md:px-16 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 rounded-3xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-[#6B6B6B]" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-2">Nothing to Checkout</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">Add some items to your cart first.</p>
          <Link href="/products"><Button variant="primary">Continue Shopping</Button></Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-16 py-8 md:py-12">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">Fill in your details and place your order.</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left — Form */}
        <div className="lg:col-span-3 space-y-8">
          {/* Contact */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#2563EB]" />
              Contact
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                id="full_name"
                value={form.full_name}
                onChange={e => updateField('full_name', e.target.value)}
                error={errors.full_name}
              />
              <Input
                label="Email"
                id="email"
                type="email"
                value={form.email}
                onChange={e => updateField('email', e.target.value)}
                error={errors.email}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Phone"
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => updateField('phone', e.target.value)}
                error={errors.phone}
              />
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              Shipping Address
            </h2>
            <div className="space-y-4">
              <Input
                label="Address Line 1"
                id="address_line1"
                value={form.address_line1}
                onChange={e => updateField('address_line1', e.target.value)}
                error={errors.address_line1}
              />
              <Input
                label="Address Line 2 (Optional)"
                id="address_line2"
                value={form.address_line2}
                onChange={e => updateField('address_line2', e.target.value)}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="City"
                  id="city"
                  value={form.city}
                  onChange={e => updateField('city', e.target.value)}
                  error={errors.city}
                />
                <Input
                  label="State"
                  id="state"
                  value={form.state}
                  onChange={e => updateField('state', e.target.value)}
                  error={errors.state}
                />
                <Input
                  label="ZIP Code"
                  id="zip"
                  value={form.zip}
                  onChange={e => updateField('zip', e.target.value)}
                  error={errors.zip}
                />
                <Input
                  label="Country"
                  id="country"
                  value={form.country}
                  onChange={e => updateField('country', e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          {/* Payment */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#2563EB]" />
              Payment Method
            </h2>
            <div className="space-y-3">
              <label className={cn(
                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                paymentMethod === 'cod' ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]/20' : 'border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)]'
              )}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="text-[#2563EB] focus:ring-[#2563EB]"
                />
                <div className="w-12 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-[#6B6B6B]">Pay when you receive your order. No card needed.</p>
                </div>
              </label>

              <label className={cn(
                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                paymentMethod === 'card' ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]/20' : 'border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)]'
              )}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="text-[#2563EB] focus:ring-[#2563EB]"
                />
                <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center border border-[rgba(0,0,0,0.06)]">
                  <CreditCard className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Credit / Debit Card</p>
                  <p className="text-xs text-[#6B6B6B]">Visa, Mastercard, RuPay, UPI, Net Banking</p>
                </div>
              </label>
            </div>
          </motion.div>
        </div>

        {/* Right — Summary */}
        <div className="lg:col-span-2">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl p-6 border border-[rgba(0,0,0,0.06)]">
              <h2 className="font-serif text-lg font-bold mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F5F5F0] shrink-0">
                      <Image src={item.image || '/placeholder.svg'} alt={item.title} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.variant_label && <p className="text-xs text-[#6B6B6B]">{item.variant_label}</p>}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-[#6B6B6B]">Qty: {item.quantity}</span>
                        <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-[rgba(0,0,0,0.06)] mb-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <hr className="border-[rgba(0,0,0,0.06)]" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Account notice */}
              {!user && !lightCustomer && (
                <div className="bg-[#F0F7FF] rounded-xl p-3 mb-4 flex items-start gap-2">
                  <User className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#2563EB]">
                    An account will be created with your email so you can track orders.
                  </p>
                </div>
              )}

              {/* Place Order */}
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={() => {
                  if (!validate()) return
                  placeOrder()
                }}
                loading={processing}
                shimmer
              >
                {processing
                  ? 'Placing order...'
                  : paymentMethod === 'cod'
                    ? `Place Order — Pay ${formatCurrency(total)} on Delivery`
                    : `Place Order — ${formatCurrency(total)}`
                }
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ShoppingBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}
