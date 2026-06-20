'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, FolderTree, Upload, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { adminFetch } from '@/lib/admin-fetch'
import { cn, slugify, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Category } from '@/types'

function buildTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>()
  const roots: Category[] = []
  categories.forEach(c => map.set(c.id, { ...c, children: [] }))
  categories.forEach(c => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(map.get(c.id)!)
    } else if (!c.parent_id) {
      roots.push(map.get(c.id)!)
    }
  })
  const sort = (list: Category[]) => {
    list.sort((a, b) => a.sort_order - b.sort_order)
    list.forEach(c => { if (c.children) sort(c.children) })
  }
  sort(roots)
  return roots
}

function TreeNode({ cat, depth = 0, onEdit, onDelete }: {
  cat: Category; depth?: number; onEdit: (c: Category) => void; onDelete: (c: Category) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = cat.children && cat.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FA] group transition-colors',
          depth > 0 && 'ml-6'
        )}
      >
        <button onClick={() => setExpanded(!expanded)} className="p-0.5">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
          ) : <div className="w-4" />}
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {cat.image_url ? (
            <Image src={getImageUrl(cat.image_url)} alt="" width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            <FolderTree className="w-4 h-4 text-[#6B6B6B]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A] truncate">{cat.name}</p>
          <p className="text-xs text-[#6B6B6B]">/{cat.slug}</p>
        </div>
        <span className="text-xs text-[#6B6B6B]">Order: {cat.sort_order}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg hover:bg-white text-[#6B6B6B] hover:text-[#2563EB]">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(cat)} className="p-1.5 rounded-lg hover:bg-white text-[#6B6B6B] hover:text-[#DC2626]">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {cat.children!.map(child => (
            <TreeNode key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminCategories() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [tree, setTree] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ name: '', slug: '', description: '', parent_id: '', sort_order: '0', image_url: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const data = await adminFetch('/api/admin/categories')
      const cats = (data || []) as Category[]
      setCategories(cats)
      setTree(buildTree(cats))
    } finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', parent_id: '', sort_order: '0', image_url: '' })
    setFormErrors({})
    setSelectedFile(null)
    setImagePreview(null)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parent_id: cat.parent_id || '',
      sort_order: cat.sort_order.toString(),
      image_url: cat.image_url || '',
    })
    setFormErrors({})
    setSelectedFile(null)
    setImagePreview(null)
    setModalOpen(true)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.slug.trim()) errs.slug = 'Slug is required'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      let image_url = form.image_url
      if (selectedFile) {
        setUploadingImage(true)
        const ext = selectedFile.name.split('.').pop()
        const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, selectedFile)
        if (uploadError) throw uploadError
        image_url = `product-images/${fileName}`
        setUploadingImage(false)
      }
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        parent_id: form.parent_id || null,
        sort_order: parseInt(form.sort_order) || 0,
        image_url: image_url || null,
      }
      if (editing) {
        await adminFetch('/api/admin/categories', { method: 'PUT', body: { id: editing.id, ...payload } })
        toast('Category updated', 'success')
      } else {
        await adminFetch('/api/admin/categories', { method: 'POST', body: payload })
        toast('Category created', 'success')
      }
      setModalOpen(false)
      loadCategories()
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally { setSaving(false); setUploadingImage(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/categories?id=${deleteTarget.id}`, { method: 'DELETE' })
      toast(`"${deleteTarget.name}" deleted`, 'success')
      setDeleteTarget(null)
      loadCategories()
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
    } finally { setDeleting(false) }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Categories</h1>
        <Button onClick={openAdd} shimmer>
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] p-2">
        {tree.length === 0 ? (
          <div className="text-center py-12 text-[#6B6B6B]">No categories yet</div>
        ) : (
          tree.map(cat => (
            <TreeNode key={cat.id} cat={cat} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">
            {editing ? 'Edit Category' : 'Add Category'}
          </h3>
          <Input label="Name" value={form.name} onChange={e => {
            setForm(prev => {
              const next = { ...prev, name: e.target.value }
              if (!editing) next.slug = slugify(e.target.value)
              return next
            })
          }} error={formErrors.name} />
          <Input label="Slug" value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} error={formErrors.slug} />
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Parent Category</label>
            <select
              value={form.parent_id}
              onChange={e => setForm(prev => ({ ...prev, parent_id: e.target.value }))}
              className="w-full h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">None (Top Level)</option>
              {categories.filter(c => c.id !== editing?.id).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Category Image</label>
            <div className="flex items-start gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#F5F5F0] border border-[rgba(0,0,0,0.06)] flex-shrink-0">
                {(imagePreview || form.image_url) ? (
                  <Image src={imagePreview || getImageUrl(form.image_url)} alt="" fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-[#6B6B6B]" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                      setImagePreview(URL.createObjectURL(file))
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-2" /> Choose Image
                </Button>
                {form.image_url && !selectedFile && (
                  <p className="text-xs text-[#6B6B6B] mt-1">Existing image will be kept</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Delete Category</h3>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
