'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Search, Edit, Trash2, Package, Filter, ChevronDown, MoreHorizontal
} from 'lucide-react'
import { adminApi } from '@/lib/admin-fetch'
import { cn, formatCurrency, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Product, Category } from '@/types'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
}

export default function AdminProducts() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [deleteModal, setDeleteModal] = useState<Product | null>(null)
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const perPage = 20

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [productsRes, catsRes] = await Promise.all([
        adminApi.select('products', [], { select: '*, category:categories(*)', order: { column: 'created_at', ascending: false } }),
        adminApi.select('categories', [], { order: { column: 'name', ascending: true } }),
      ])
      setProducts((productsRes || []) as Product[])
      setCategories((catsRes || []) as Category[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(p => p.title.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s))
    }
    if (categoryFilter) list = list.filter(p => p.category_id === categoryFilter)
    if (statusFilter) list = list.filter(p => p.status === statusFilter)
    list.sort((a, b) => {
      const aVal = (a as any)[sortField]
      const bVal = (b as any)[sortField]
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
    })
    return list
  }, [products, search, categoryFilter, statusFilter, sortField, sortDir])

  const paginated = useMemo(() => filtered.slice(page * perPage, (page + 1) * perPage), [filtered, page])
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selected.length === paginated.length) setSelected([])
    else setSelected(paginated.map(p => p.id))
  }

  const handleDelete = useCallback(async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await adminApi.delete('products', [{ method: 'eq', column: 'id', value: deleteModal.id }])
      toast(`"${deleteModal.title}" deleted`, 'success')
      setProducts(prev => prev.filter(p => p.id !== deleteModal.id))
      setDeleteModal(null)
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }, [deleteModal, toast])

  const handleBulkDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await adminApi.delete('products', [{ method: 'in', column: 'id', value: selected }])
      toast(`${selected.length} products deleted`, 'success')
      setProducts(prev => prev.filter(p => !selected.includes(p.id)))
      setSelected([])
      setBulkDeleteModal(false)
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }, [selected, toast])

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Products</h1>
        <Button onClick={() => router.push('/admin/products/new')} shimmer>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
          className="h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        {selected.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteModal(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete {selected.length}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)]">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.length === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Product</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('sku')}>
                  SKU {sortField === 'sku' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Category</th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('price')}>
                  Price {sortField === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B] cursor-pointer select-none" onClick={() => toggleSort('stock_quantity')}>
                  Stock {sortField === 'stock_quantity' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-medium text-[#6B6B6B]">Status</th>
                <th className="p-3 text-right font-medium text-[#6B6B6B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#F8F9FA] transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex-shrink-0 overflow-hidden">
                        {product.images && product.images[0] ? (
                          <Image src={getImageUrl(product.images[0].image_url)} alt="" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 m-auto text-[#6B6B6B]" style={{ marginTop: 10 }} />
                        )}
                      </div>
                      <span className="font-medium text-[#1A1A1A] hover:text-[#2563EB]">{product.title}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-[#6B6B6B]">{product.sku}</td>
                  <td className="p-3 text-[#6B6B6B]">{product.category?.name || '-'}</td>
                  <td className="p-3 font-medium">
                    {product.sale_price ? (
                      <span>
                        <span className="text-[#DC2626]">{formatCurrency(product.sale_price)}</span>
                        <span className="text-[#6B6B6B] line-through ml-1 text-xs">{formatCurrency(product.price)}</span>
                      </span>
                    ) : formatCurrency(product.price)}
                  </td>
                  <td className="p-3">
                    <span className={cn(product.stock_quantity <= 5 ? 'text-[#DC2626] font-medium' : 'text-[#6B6B6B]')}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColors[product.status])}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                        className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B6B] hover:text-[#2563EB]"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal(product)}
                        className="p-2 rounded-lg hover:bg-[#F5F5F0] text-[#6B6B6B] hover:text-[#DC2626]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginated.length === 0 && (
          <div className="text-center py-12 text-[#6B6B6B]">No products found</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-[#F5F5F0] disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg',
                page === i ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F5F5F0]'
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-[#F5F5F0] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} size="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Delete Product</h3>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Are you sure you want to delete "{deleteModal?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkDeleteModal} onClose={() => setBulkDeleteModal(false)} size="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Delete {selected.length} Products</h3>
          <p className="text-sm text-[#6B6B6B] mb-4">Are you sure? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBulkDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleBulkDelete}>Delete All</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
