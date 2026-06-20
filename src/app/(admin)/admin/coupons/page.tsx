'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Coupon, Category } from '@/types'

export default function AdminCoupons() {
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const perPage = 20

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_order_amount: '',
    usage_limit: '',
    per_customer_limit: '',
    valid_from: '',
    valid_to: '',
    applicable_products: [] as string[],
    applicable_categories: [] as string[],
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [couponsRes, catsRes, productsRes] = await Promise.all([
        adminApi.select('coupons', [], { order: { column: 'created_at', ascending: false } }),
        adminApi.select('categories', [], { select: 'id, name', order: { column: 'name', ascending: true } }),
        adminApi.select('products', [{ method: 'eq', column: 'status', value: 'active' }], { select: 'id, title' }),
      ])
      setCoupons((couponsRes || []) as Coupon[])
      setCategories((catsRes || []) as Category[])
      setProducts((productsRes || []) as Array<{ id: string; title: string }>)
    } finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ code: '', type: 'percentage', value: '', min_order_amount: '', usage_limit: '', per_customer_limit: '', valid_from: '', valid_to: '', applicable_products: [], applicable_categories: [], is_active: true })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_customer_limit: coupon.per_customer_limit?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.substring(0, 16) : '',
      valid_to: coupon.valid_to ? coupon.valid_to.substring(0, 16) : '',
      applicable_products: coupon.applicable_products || [],
      applicable_categories: coupon.applicable_categories || [],
      is_active: coupon.is_active,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.code.trim()) errs.code = 'Code is required'
    if (!form.value || parseFloat(form.value) <= 0) errs.value = 'Value must be > 0'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const data = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        per_customer_limit: form.per_customer_limit ? parseInt(form.per_customer_limit) : null,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        applicable_products: form.applicable_products,
        applicable_categories: form.applicable_categories,
        is_active: form.is_active,
      }
      if (editing) {
        await adminApi.update('coupons', data, [{ method: 'eq', column: 'id', value: editing.id }])
        toast('Coupon updated', 'success')
      } else {
        await adminApi.insert('coupons', data)
        toast('Coupon created', 'success')
      }
      setModalOpen(false)
      loadData()
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.delete('coupons', [{ method: 'eq', column: 'id', value: deleteTarget.id }])
      toast('Coupon deleted', 'success')
      setDeleteTarget(null)
      loadData()
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
    } finally { setDeleting(false) }
  }

  const filtered = useMemo(() => {
    const list = [...coupons].sort((a, b) => {
      const aVal = (a as any)[sortField]
      const bVal = (b as any)[sortField]
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
    })
    return list
  }, [coupons, sortField, sortDir])

  const paginated = useMemo(() => filtered.slice(page * perPage, (page + 1) * perPage), [filtered, page])
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Coupons</h1>
        <Button onClick={openAdd} shimmer>
          <Plus className="w-4 h-4 mr-2" /> Add Coupon
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)]">
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('code')}>
                  Code {sortField === 'code' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Type</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('value')}>
                  Value {sortField === 'value' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('min_order_amount')}>
                  Min Order {sortField === 'min_order_amount' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Usage</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Valid Dates</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Status</th>
                <th className="p-3 text-right font-medium text-[#6B6B6B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((coupon) => (
                <motion.tr
                  key={coupon.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#F8F9FA]"
                >
                  <td className="p-3 font-mono font-semibold text-[#2563EB]">{coupon.code}</td>
                  <td className="p-3 capitalize">{coupon.type}</td>
                  <td className="p-3 font-medium">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </td>
                  <td className="p-3">{coupon.min_order_amount ? formatCurrency(coupon.min_order_amount) : '-'}</td>
                  <td className="p-3">{coupon.times_used}/{coupon.usage_limit || '∞'}</td>
                  <td className="p-3 text-xs text-[#6B6B6B]">
                    {coupon.valid_from ? format(parseISO(coupon.valid_from), 'MMM d') : 'Any'} - {coupon.valid_to ? format(parseISO(coupon.valid_to), 'MMM d, yyyy') : 'Any'}
                  </td>
                  <td className="p-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(coupon)} className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B6B] hover:text-[#2563EB]">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(coupon)} className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B6B] hover:text-[#DC2626]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginated.length === 0 && <div className="text-center py-12 text-[#6B6B6B]">No coupons yet</div>}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{editing ? 'Edit Coupon' : 'Add Coupon'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} error={formErrors.code} placeholder="e.g. SUMMER20" />
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Type</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <Input label="Value" type="number" step="0.01" value={form.value} onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))} error={formErrors.value} />
            <Input label="Min Order Amount" type="number" step="0.01" value={form.min_order_amount} onChange={e => setForm(prev => ({ ...prev, min_order_amount: e.target.value }))} />
            <Input label="Usage Limit" type="number" value={form.usage_limit} onChange={e => setForm(prev => ({ ...prev, usage_limit: e.target.value }))} />
            <Input label="Per Customer Limit" type="number" value={form.per_customer_limit} onChange={e => setForm(prev => ({ ...prev, per_customer_limit: e.target.value }))} />
            <Input label="Valid From" type="datetime-local" value={form.valid_from} onChange={e => setForm(prev => ({ ...prev, valid_from: e.target.value }))} />
            <Input label="Valid To" type="datetime-local" value={form.valid_to} onChange={e => setForm(prev => ({ ...prev, valid_to: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Applicable Products</label>
            <div className="max-h-32 overflow-y-auto border border-[rgba(0,0,0,0.12)] rounded-xl p-2">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-[#F8F9FA]">
                  <input type="checkbox" checked={form.applicable_products.includes(p.id)}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      applicable_products: e.target.checked
                        ? [...prev.applicable_products, p.id]
                        : prev.applicable_products.filter(id => id !== p.id)
                    }))} className="rounded" />
                  {p.title}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Applicable Categories</label>
            <div className="max-h-32 overflow-y-auto border border-[rgba(0,0,0,0.12)] rounded-xl p-2">
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-[#F8F9FA]">
                  <input type="checkbox" checked={form.applicable_categories.includes(c.id)}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      applicable_categories: e.target.checked
                        ? [...prev.applicable_categories, c.id]
                        : prev.applicable_categories.filter(id => id !== c.id)
                    }))} className="rounded" />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} className="rounded" />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Delete Coupon</h3>
          <p className="text-sm text-[#6B6B6B] mb-4">Are you sure you want to delete "{deleteTarget?.code}"?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
