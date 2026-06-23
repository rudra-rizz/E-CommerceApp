import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order delete error:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, payment_status, razorpay_payment_id } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    const updateData: Record<string, any> = { payment_status }

    if (razorpay_payment_id) {
      updateData.razorpay_payment_id = razorpay_payment_id
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      user_id,
      email,
      items,
      shipping_address,
      billing_address,
      shipping_method,
      shipping_cost,
      coupon_code,
      notes,
    } = await request.json()

    if (!email || !items || !items.length) {
      return NextResponse.json({ error: 'Email and items are required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()

    const productIds = items.map((i: { product_id: string }) => i.product_id)
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, price, sale_price, sale_start, sale_end, stock_quantity, track_inventory, allow_backorders')
      .in('id', productIds)

    if (productError || !products) {
      return NextResponse.json({ error: 'Failed to validate products' }, { status: 500 })
    }

    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id)
      if (!product) {
        return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 })
      }

      const now = new Date()
      const isOnSale =
        product.sale_price &&
        (!product.sale_start || new Date(product.sale_start) <= now) &&
        (!product.sale_end || new Date(product.sale_end) >= now)
      const unitPrice = isOnSale ? product.sale_price : product.price
      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal

      if (product.track_inventory && !product.allow_backorders && product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.title}` },
          { status: 400 }
        )
      }

      orderItems.push({
        product_id: product.id,
        variant_id: item.variant_id || null,
        title: product.title,
        variant_info: item.variant_info || null,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      })
    }

    let discountAmount = 0
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code)
        .eq('is_active', true)
        .single()

      if (coupon) {
        const now = new Date()
        const isValid =
          (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
          (!coupon.valid_to || new Date(coupon.valid_to) >= now) &&
          (!coupon.usage_limit || coupon.times_used < coupon.usage_limit) &&
          (!coupon.min_order_amount || subtotal >= coupon.min_order_amount)

        if (isValid) {
          discountAmount = coupon.type === 'percentage'
            ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
            : coupon.value
        }
      }
    }

    const { data: settings } = await supabase
      .from('site_settings')
      .select('tax_rate')
      .single()

    const taxRate = settings?.tax_rate || 0
    const amountAfterDiscount = subtotal - discountAmount
    const taxAmount = Math.round(amountAfterDiscount * (taxRate / 100) * 100) / 100
    const shipCost = shipping_cost || 0
    const total = Math.round((amountAfterDiscount + taxAmount + shipCost) * 100) / 100

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user_id || null,
        email,
        shipping_address: shipping_address || null,
        billing_address: billing_address || shipping_address || null,
        shipping_method: shipping_method || null,
        shipping_cost: shipCost,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total,
        coupon_code: coupon_code || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
