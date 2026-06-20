'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  FileText, Plus, Eye, EyeOff, Trash2, Save, X, Bold, Italic,
  Heading2, Heading3, List, ListOrdered, Image as ImageIcon, Link, Loader2
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { adminFetch } from '@/lib/admin-fetch'
import { cn, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import type { Page } from '@/types'

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg transition-colors',
        active ? 'bg-[#2563EB] text-white' : 'text-[#4A4A4A] hover:bg-[#F5F5F0]'
      )}
    >
      {children}
    </button>
  )
}

function EditorToolbar({ editor }: { editor: any }) {
  const addImage = useCallback(() => {
    const url = prompt('Enter image URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = prompt('Enter link URL:', previousUrl || '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div className="flex items-center gap-1 p-2 border-b border-[rgba(0,0,0,0.06)] flex-wrap">
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-[rgba(0,0,0,0.08)] mx-1" />
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-[rgba(0,0,0,0.08)] mx-1" />
      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-[rgba(0,0,0,0.08)] mx-1" />
      <ToolbarButton onClick={addImage}>
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('link')}
        onClick={setLink}
      >
        <Link className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}

export default function AdminPages() {
  const { toast } = useToast()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Page | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    meta_title: '',
    meta_description: '',
    is_visible: true,
  })
  const [content, setContent] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Write page content here...' }),
    ],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-[#1A1A1A]',
      },
    },
  })

  useEffect(() => { loadPages() }, [])

  useEffect(() => {
    if (editor && modalOpen && editing) {
      const html = editing.content || ''
      if (editor.getHTML() !== html) {
        editor.commands.setContent(html)
        setContent(html)
      }
    }
    if (editor && !modalOpen) {
      editor.commands.setContent('')
      setContent('')
    }
  }, [modalOpen, editing, editor])

  async function loadPages() {
    setLoading(true)
    try {
      const data = await adminFetch('/api/admin/pages')
      setPages((data || []) as Page[])
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (page: Page) => {
    setEditing(page)
    setForm({
      title: page.title,
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      is_visible: page.is_visible,
    })
    setContent(page.content || '')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!editing) return
    if (!form.title.trim()) {
      toast('Title is required', 'error')
      return
    }
    setSaving(true)
    try {
      await adminFetch('/api/admin/pages', {
        method: 'PUT',
        body: {
          id: editing.id,
          title: form.title.trim(),
          content: content || null,
          meta_title: form.meta_title.trim() || null,
          meta_description: form.meta_description.trim() || null,
          is_visible: form.is_visible,
        },
      })
      toast('Page updated', 'success')
      setModalOpen(false)
      loadPages()
    } catch (err: any) {
      toast(err.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleVisibility = async (page: Page) => {
    try {
      await adminFetch('/api/admin/pages', {
        method: 'PUT',
        body: { id: page.id, is_visible: !page.is_visible },
      })
      setPages(prev =>
        prev.map(p => (p.id === page.id ? { ...p, is_visible: !p.is_visible } : p))
      )
      toast(page.is_visible ? 'Page hidden' : 'Page visible', 'success')
    } catch (err: any) {
      toast(err.message || 'Toggle failed', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/pages?id=${deleteTarget.id}`, { method: 'DELETE' })
      toast(`"${deleteTarget.title}" deleted`, 'success')
      setDeleteTarget(null)
      loadPages()
    } catch (err: any) {
      toast(err.message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)]">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 border-b border-[rgba(0,0,0,0.04)]">
              <Skeleton className="h-5 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Pages</h1>
      </div>

      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6B6B6B]">
            <FileText className="w-12 h-12 mb-3 text-[#6B6B6B]/50" />
            <p className="text-sm font-medium">No pages yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)]">
                  <th className="text-left text-[#6B6B6B] text-xs uppercase tracking-wider font-medium px-4 py-3">Title</th>
                  <th className="text-left text-[#6B6B6B] text-xs uppercase tracking-wider font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                  <th className="text-left text-[#6B6B6B] text-xs uppercase tracking-wider font-medium px-4 py-3 hidden md:table-cell">Last Updated</th>
                  <th className="text-center text-[#6B6B6B] text-xs uppercase tracking-wider font-medium px-4 py-3 w-24">Visible</th>
                  <th className="text-right text-[#6B6B6B] text-xs uppercase tracking-wider font-medium px-4 py-3 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page, idx) => (
                  <motion.tr
                    key={page.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#F8F9FA] transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(page)}
                        className="text-sm font-medium text-[#1A1A1A] hover:text-[#2563EB] transition-colors text-left"
                      >
                        {page.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] hidden sm:table-cell">
                      /{page.slug}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B6B6B] hidden md:table-cell">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleVisibility(page)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          page.is_visible
                            ? 'text-[#16A34A] hover:bg-[#16A34A]/10'
                            : 'text-[#6B6B6B] hover:bg-[#F5F5F0]'
                        )}
                        title={page.is_visible ? 'Visible' : 'Hidden'}
                      >
                        {page.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(page)}
                          className="p-1.5 rounded-lg hover:bg-white text-[#6B6B6B] hover:text-[#2563EB] transition-colors"
                          title="Edit"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(page)}
                          className="p-1.5 rounded-lg hover:bg-white text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="full">
        <div className="p-6 space-y-5">
          <h3 className="text-lg font-semibold text-[#1A1A1A]">
            Edit Page
          </h3>

          <Input
            label="Slug"
            value={editing?.slug || ''}
            disabled
          />

          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Content
            </label>
            <div className="border border-[rgba(0,0,0,0.12)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:border-transparent">
              {editor && <EditorToolbar editor={editor} />}
              <EditorContent editor={editor} />
            </div>
          </div>

          <Input
            label="Meta Title"
            value={form.meta_title}
            onChange={e => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Meta Description
            </label>
            <textarea
              value={form.meta_description}
              onChange={e => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-[#6B6B6B]"
              placeholder="Meta description for SEO..."
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.is_visible}
              onClick={() => setForm(prev => ({ ...prev, is_visible: !prev.is_visible }))}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                form.is_visible ? 'bg-[#2563EB]' : 'bg-[rgba(0,0,0,0.15)]'
              )}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm',
                )}
              />
            </button>
            <span className="text-sm text-[#1A1A1A]">Visible on site</span>
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-[rgba(0,0,0,0.06)]">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Delete Page</h3>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
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
