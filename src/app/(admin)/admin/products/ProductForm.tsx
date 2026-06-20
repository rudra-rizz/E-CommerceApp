'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Save, Eye, X, Plus, Trash2, Upload, Image as ImageIcon, GripVertical
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { adminApi } from '@/lib/admin-fetch'
import { cn, slugify, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Product, Category, ProductOption, ProductVariant, ProductImage } from '@/types'

interface OptionGroup {
  name: string
  values: string[]
}

interface FormData {
  title: string
  slug: string
  description: string
  category_id: string
  tags: string[]
  price: string
  sale_price: string
  sale_start: string
  sale_end: string
  sku: string
  stock_quantity: string
  track_inventory: boolean
  allow_backorders: boolean
  status: 'draft' | 'active'
  meta_title: string
  meta_description: string
  og_image_url: string
}

interface Props {
  productId?: string
}

export default function AdminProductForm({ productId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(!!productId)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [variants, setVariants] = useState<Array<{ sku: string; price: string; stock: string; values: Record<string, string> }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<FormData>({
    title: '',
    slug: '',
    description: '',
    category_id: '',
    tags: [],
    price: '',
    sale_price: '',
    sale_start: '',
    sale_end: '',
    sku: '',
    stock_quantity: '0',
    track_inventory: true,
    allow_backorders: false,
    status: 'active',
    meta_title: '',
    meta_description: '',
    og_image_url: '',
  })

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => setForm(prev => ({ ...prev, description: editor.getHTML() })),
  })

  useEffect(() => {
    adminApi.select('categories', [], { order: { column: 'name', ascending: true } }).then((data) => {
      setCategories((data || []) as Category[])
    })
    if (productId) loadProduct(productId)
  }, [productId])

  async function loadProduct(id: string) {
    setLoading(true)
    try {
      const data = await adminApi.select('products', [{ method: 'eq', column: 'id', value: id }], { select: '*, images:product_images(*), options:product_options(*, values:product_option_values(*)), variants:product_variants(*)', single: true })
      const p = data as Product
      setForm({
        title: p.title,
        slug: p.slug,
        description: p.description || '',
        category_id: p.category_id || '',
        tags: p.tags || [],
        price: p.price.toString(),
        sale_price: p.sale_price?.toString() || '',
        sale_start: p.sale_start ? p.sale_start.substring(0, 16) : '',
        sale_end: p.sale_end ? p.sale_end.substring(0, 16) : '',
        sku: p.sku,
        stock_quantity: p.stock_quantity.toString(),
        track_inventory: p.track_inventory,
        allow_backorders: p.allow_backorders,
        status: p.status,
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
        og_image_url: p.og_image_url || '',
      })
      if (p.description && editor) editor.commands.setContent(p.description)
      setExistingImages(p.images || [])

      if (p.options && p.options.length > 0) {
        const groups: OptionGroup[] = p.options.map(o => ({
          name: o.name,
          values: (o.values || []).map(v => v.value),
        }))
        setOptionGroups(groups)
        if (p.variants && p.variants.length > 0) {
          setVariants(p.variants.map(v => ({
            sku: v.sku,
            price: v.price?.toString() || '',
            stock: v.stock_quantity.toString(),
            values: v.option_values,
          })))
        }
      }
    } catch (err: any) {
      toast('Failed to load product', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof FormData, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !productId) next.slug = slugify(value)
      return next
    })
    if (errors[field]) setErrors(prev => { const { [field]: _, ...rest } = prev; return rest })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.slug.trim()) errs.slug = 'Slug is required'
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Valid price required'
    if (!form.sku.trim()) errs.sku = 'SKU is required'
    if (form.track_inventory && !form.stock_quantity) errs.stock_quantity = 'Stock required when tracking'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const { data, error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) throw error
    return `product-images/${fileName}`
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        if (productId) {
          const path = await uploadImage(file)
          const data = await adminApi.insert('product_images', {
            product_id: productId,
            image_url: path,
            sort_order: existingImages.length + 1,
          }, { single: true })
          if (data) setExistingImages(prev => [...prev, data as ProductImage])
        } else {
          setUploadedFiles(prev => [...prev, file])
        }
      }
      toast('Images uploaded', 'success')
    } catch (err: any) {
      toast(err.message || 'Upload failed', 'error')
    } finally {
      setUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const removeExistingImage = async (imageId: string) => {
    try {
      await adminApi.delete('product_images', [{ method: 'eq', column: 'id', value: imageId }])
      setExistingImages(prev => prev.filter(i => i.id !== imageId))
      toast('Image removed', 'info')
    } catch { toast('Failed to remove image', 'error') }
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addOptionGroup = () => {
    setOptionGroups(prev => [...prev, { name: '', values: [''] }])
  }

  const updateOptionGroup = (index: number, field: keyof OptionGroup, value: any) => {
    setOptionGroups(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g))
  }

  const removeOptionGroup = (index: number) => {
    setOptionGroups(prev => prev.filter((_, i) => i !== index))
    setVariants([])
  }

  const generateVariants = () => {
    const valid = optionGroups.filter(g => g.name.trim() && g.values.some(v => v.trim()))
    if (valid.length === 0) { setVariants([]); return }

    const combine = (groups: OptionGroup[], current: Record<string, string>): Record<string, string>[] => {
      if (groups.length === 0) return [current]
      const [first, ...rest] = groups
      return first.values.filter(v => v.trim()).flatMap(val =>
        combine(rest, { ...current, [first.name]: val.trim() })
      )
    }
    const combos = combine(valid, {})
    setVariants(combos.map(v => ({
      sku: `${form.sku}-${Object.values(v).join('-')}`,
      price: '',
      stock: '0',
      values: v,
    })))
  }

  useEffect(() => { generateVariants() }, [optionGroups])

  const updateVariant = (index: number, field: keyof typeof variants[0], value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = (e.target as HTMLInputElement).value.trim()
      if (val && !form.tags.includes(val)) {
        updateField('tags', [...form.tags, val])
      }
      (e.target as HTMLInputElement).value = ''
    }
  }

  const removeTag = (tag: string) => {
    updateField('tags', form.tags.filter(t => t !== tag))
  }

  const handleSubmit = async (status: 'draft' | 'active') => {
    updateField('status', status)
    setForm(prev => ({ ...prev, status }))
    if (!validate()) {
      toast('Please fix validation errors', 'error')
      return
    }
    setSaving(true)
    try {
      const productData = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description || null,
        category_id: form.category_id || null,
        tags: form.tags,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        sale_start: form.sale_start || null,
        sale_end: form.sale_end || null,
        sku: form.sku.trim(),
        stock_quantity: parseInt(form.stock_quantity) || 0,
        track_inventory: form.track_inventory,
        allow_backorders: form.allow_backorders,
        status,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        og_image_url: form.og_image_url || null,
      }

      if (productId) {
        await adminApi.update('products', productData, [{ method: 'eq', column: 'id', value: productId }])

        if (optionGroups.length > 0) {
          await adminApi.delete('product_options', [{ method: 'eq', column: 'product_id', value: productId }])
          await adminApi.delete('product_variants', [{ method: 'eq', column: 'product_id', value: productId }])
          for (const group of optionGroups) {
            const opt = await adminApi.insert('product_options', {
              product_id: productId, name: group.name, sort_order: 0
            }, { single: true })
            if (opt && group.values.length > 0) {
              await adminApi.insert('product_option_values',
                group.values.filter(v => v.trim()).map((v, i) => ({
                  option_id: opt.id, value: v.trim(), sort_order: i
                }))
              )
            }
          }
          if (variants.length > 0) {
            await adminApi.insert('product_variants',
              variants.map(v => ({
                product_id: productId,
                sku: v.sku,
                price: v.price ? parseFloat(v.price) : null,
                stock_quantity: parseInt(v.stock) || 0,
                option_values: v.values,
              }))
            )
          }
        }

        for (const file of uploadedFiles) {
          const path = await uploadImage(file)
          await adminApi.insert('product_images', {
            product_id: productId, image_url: path, sort_order: existingImages.length + 1,
          })
        }

        toast('Product updated', 'success')
      } else {
        const result = await adminApi.insert('products', productData, { single: true })
        const newId = (result as Product).id

        for (const file of uploadedFiles) {
          const path = await uploadImage(file)
          await adminApi.insert('product_images', {
            product_id: newId, image_url: path, sort_order: 0,
          })
        }

        if (optionGroups.length > 0) {
          for (const group of optionGroups) {
            const opt = await adminApi.insert('product_options', {
              product_id: newId, name: group.name, sort_order: 0
            }, { single: true })
            if (opt && group.values.length > 0) {
              await adminApi.insert('product_option_values',
                group.values.filter(v => v.trim()).map((v, i) => ({
                  option_id: opt.id, value: v.trim(), sort_order: i
                }))
              )
            }
          }
          if (variants.length > 0) {
            await adminApi.insert('product_variants',
              variants.map(v => ({
                product_id: newId,
                sku: v.sku,
                price: v.price ? parseFloat(v.price) : null,
                stock_quantity: parseInt(v.stock) || 0,
                option_values: v.values,
              }))
            )
          }
        }

        toast('Product created', 'success')
      }
      router.push('/admin/products')
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">{productId ? 'Edit Product' : 'New Product'}</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button loading={saving} shimmer onClick={() => handleSubmit('active')}>
            <Eye className="w-4 h-4 mr-2" /> Publish
          </Button>
          <Button variant="secondary" loading={saving} onClick={() => handleSubmit('draft')}>
            <Save className="w-4 h-4 mr-2" /> Save as Draft
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Basic Information</h2>
            <Input
              label="Title"
              value={form.title}
              onChange={e => updateField('title', e.target.value)}
              error={errors.title}
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={e => updateField('slug', e.target.value)}
              error={errors.slug}
            />
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Description</label>
              <div className="border border-[rgba(0,0,0,0.12)] rounded-xl overflow-hidden">
                <div className="border-b border-[rgba(0,0,0,0.06)] px-3 py-2 flex gap-1">
                  <button onClick={() => editor?.chain().focus().toggleBold().run()} className={cn('p-1 rounded hover:bg-[#F5F5F0] text-sm', editor?.isActive('bold') && 'bg-[#F5F5F0]')}>B</button>
                  <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={cn('p-1 rounded hover:bg-[#F5F5F0] text-sm italic', editor?.isActive('italic') && 'bg-[#F5F5F0]')}>I</button>
                  <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={cn('p-1 rounded hover:bg-[#F5F5F0] text-sm', editor?.isActive('heading', { level: 2 }) && 'bg-[#F5F5F0]')}>H2</button>
                  <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={cn('p-1 rounded hover:bg-[#F5F5F0] text-sm', editor?.isActive('heading', { level: 3 }) && 'bg-[#F5F5F0]')}>H3</button>
                  <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={cn('p-1 rounded hover:bg-[#F5F5F0] text-sm', editor?.isActive('bulletList') && 'bg-[#F5F5F0]')}>• List</button>
                  <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={cn('p-1 rounded hover:bg-[#F5F5F0] text-sm', editor?.isActive('orderedList') && 'bg-[#F5F5F0]')}>1. List</button>
                </div>
                <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[200px]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Category</label>
              <select
                value={form.category_id}
                onChange={e => updateField('category_id', e.target.value)}
                className="w-full h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs bg-[#F5F5F0] rounded-lg">
                    {tag}
                    <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <Input placeholder="Type tag and press Enter" onKeyDown={handleTagKeyDown} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Regular Price" type="number" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)} error={errors.price} />
              <Input label="Sale Price" type="number" step="0.01" value={form.sale_price} onChange={e => updateField('sale_price', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Sale Start" type="datetime-local" value={form.sale_start} onChange={e => updateField('sale_start', e.target.value)} />
              <Input label="Sale End" type="datetime-local" value={form.sale_end} onChange={e => updateField('sale_end', e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU" value={form.sku} onChange={e => updateField('sku', e.target.value)} error={errors.sku} />
              <Input label="Stock Quantity" type="number" value={form.stock_quantity} onChange={e => updateField('stock_quantity', e.target.value)} error={errors.stock_quantity} disabled={!form.track_inventory} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.track_inventory} onChange={e => updateField('track_inventory', e.target.checked)} className="rounded" />
                Track Inventory
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allow_backorders} onChange={e => updateField('allow_backorders', e.target.checked)} className="rounded" />
                Allow Backorders
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Variants</h2>
            {optionGroups.map((group, gi) => (
              <div key={gi} className="p-4 bg-[#F8F9FA] rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    placeholder="Option name (e.g. Size)"
                    value={group.name}
                    onChange={e => updateOptionGroup(gi, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <button onClick={() => removeOptionGroup(gi)} className="p-2 text-[#DC2626] hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((val, vi) => (
                    <div key={vi} className="flex items-center gap-1">
                      <input
                        className="w-24 px-2 py-1 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg"
                        placeholder={`Value ${vi + 1}`}
                        value={val}
                        onChange={e => {
                          const newValues = [...group.values]
                          newValues[vi] = e.target.value
                          updateOptionGroup(gi, 'values', newValues)
                        }}
                      />
                      {group.values.length > 1 && (
                        <button
                          onClick={() => updateOptionGroup(gi, 'values', group.values.filter((_, i) => i !== vi))}
                          className="p-0.5 text-[#6B6B6B] hover:text-[#DC2626]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => updateOptionGroup(gi, 'values', [...group.values, ''])}
                    className="px-2 py-1 text-xs text-[#2563EB] hover:bg-blue-50 rounded-lg"
                  >
                    + Add value
                  </button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOptionGroup}>
              <Plus className="w-4 h-4 mr-2" /> Add Option Group
            </Button>

            {variants.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(0,0,0,0.06)]">
                      {Object.keys(variants[0].values).map(k => (
                        <th key={k} className="p-2 text-left font-medium text-[#6B6B6B]">{k}</th>
                      ))}
                      <th className="p-2 text-left font-medium text-[#6B6B6B]">SKU</th>
                      <th className="p-2 text-left font-medium text-[#6B6B6B]">Price</th>
                      <th className="p-2 text-left font-medium text-[#6B6B6B]">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i} className="border-b border-[rgba(0,0,0,0.04)]">
                        {Object.values(v.values).map((val, j) => (
                          <td key={j} className="p-2 text-[#1A1A1A]">{val}</td>
                        ))}
                        <td className="p-2">
                          <input className="w-28 px-2 py-1 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} />
                        </td>
                        <td className="p-2">
                          <input className="w-20 px-2 py-1 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg" type="number" step="0.01" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                        </td>
                        <td className="p-2">
                          <input className="w-16 px-2 py-1 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Media</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[rgba(0,0,0,0.12)] rounded-xl p-6 text-center cursor-pointer hover:border-[#2563EB] transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-[#6B6B6B]" />
              <p className="text-sm text-[#6B6B6B]">Drop images here or click to upload</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploadingImage && <p className="text-xs text-[#6B6B6B]">Uploading...</p>}
            <div className="grid grid-cols-3 gap-2">
              {existingImages.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[#F5F5F0]">
                  <Image src={getImageUrl(img.image_url)} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {uploadedFiles.map((file, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-[#F5F5F0]">
                  <Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removeUploadedFile(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">SEO</h2>
            <Input label="Meta Title" value={form.meta_title} onChange={e => updateField('meta_title', e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Meta Description</label>
              <textarea
                value={form.meta_description}
                onChange={e => updateField('meta_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <Input label="OG Image URL" value={form.og_image_url} onChange={e => updateField('og_image_url', e.target.value)} />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] space-y-4">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Status</h2>
            <div className="flex gap-3">
              <button
                onClick={() => updateField('status', 'draft')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
                  form.status === 'draft' ? 'bg-gray-100 text-[#1A1A1A]' : 'bg-white border border-[rgba(0,0,0,0.12)] text-[#6B6B6B]'
                )}
              >
                Draft
              </button>
              <button
                onClick={() => updateField('status', 'active')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
                  form.status === 'active' ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-white border border-[rgba(0,0,0,0.12)] text-[#6B6B6B]'
                )}
              >
                Active
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
        <Button variant="outline" onClick={() => router.back()}>
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
        <Button variant="secondary" loading={saving} onClick={() => handleSubmit('draft')}>
          <Save className="w-4 h-4 mr-2" /> Save as Draft
        </Button>
        <Button loading={saving} shimmer onClick={() => handleSubmit('active')}>
          <Eye className="w-4 h-4 mr-2" /> Publish
        </Button>
      </div>
    </div>
  )
}
