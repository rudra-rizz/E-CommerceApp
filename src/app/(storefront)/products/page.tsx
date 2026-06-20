'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, ChevronDown, Loader2, LayoutGrid, List, Eye, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatCurrency, getSalePrice, getImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { ProductCard } from '@/components/storefront/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { QuantitySelector } from '@/components/storefront/QuantitySelector'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/components/ui/toast'
import type { Product, Category } from '@/types'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'bestselling', label: 'Best Selling' },
]

const PRICE_RANGES = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: 'Over $250', min: 250, max: Infinity },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const sortLabel = (value: string) => SORT_OPTIONS.find(o => o.value === value)?.label || value

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quickViewQuantity, setQuickViewQuantity] = useState(1)

  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const selectedCategories = searchParams.getAll('cat')

  const PER_PAGE = 12

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    router.push(`/products?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const fetchProducts = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1 && !append) setLoading(true)
    else if (append) setLoadingMore(true)

    try {
      let query = supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*)', { count: 'exact' })
        .eq('status', 'active')

      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories)
      }
      if (category) {
        query = query.eq('category.slug', category)
      }
      if (priceMin) query = query.gte('price', parseFloat(priceMin))
      if (priceMax) query = query.lte('price', parseFloat(priceMax))

      switch (sort) {
        case 'price-asc': query = query.order('price', { ascending: true }); break
        case 'price-desc': query = query.order('price', { ascending: false }); break
        case 'newest':
        default: query = query.order('created_at', { ascending: false })
      }

      const from = (pageNum - 1) * PER_PAGE
      const to = from + PER_PAGE - 1
      query = query.range(from, to)

      const { data, count } = await query

      if (data) {
        setProducts(prev => append ? [...prev, ...data] : data)
        setHasMore(count ? from + PER_PAGE < count : false)
      }
    } catch {
      // empty
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [category, sort, priceMin, priceMax, selectedCategories])

  useEffect(() => {
    setPage(1)
    fetchProducts(1)
  }, [fetchProducts])

  useEffect(() => {
    supabase.from('categories').select('*').is('parent_id', null).order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(nextPage, true)
  }

  const toggleCategory = (catId: string) => {
    const current = [...selectedCategories]
    const idx = current.indexOf(catId)
    if (idx > -1) current.splice(idx, 1)
    else current.push(catId)
    updateParams({ cat: current.length > 0 ? current.join(',') : null })
  }

  const clearFilters = () => {
    router.push('/products', { scroll: false })
  }

  const hasActiveFilters = selectedCategories.length > 0 || priceMin || priceMax || category || sort !== 'newest'

  const handleQuickViewOpen = (product: Product) => {
    setQuickViewProduct(product)
    setSelectedImageIndex(0)
    setQuickViewQuantity(1)
    if (product.options && product.options.length > 0) {
      const initial: Record<string, string> = {}
      product.options.forEach(opt => {
        if (opt.values && opt.values.length > 0) {
          initial[opt.name] = opt.values[0].value
        }
      })
      setSelectedOptions(initial)
    } else {
      setSelectedOptions({})
    }
  }

  const handleQuickViewAddToCart = () => {
    if (!quickViewProduct) return
    const salePrice = getSalePrice(quickViewProduct)
    const mainImage = getImageUrl(quickViewProduct.images?.[0]?.image_url) || '/placeholder.svg'
    const variantLabel = Object.values(selectedOptions).join(', ')

    let variantId: string | null = null
    let variantPrice = salePrice || quickViewProduct.price
    let variantStock = quickViewProduct.stock_quantity

    if (quickViewProduct.variants && quickViewProduct.variants.length > 0 && Object.keys(selectedOptions).length > 0) {
      const matching = quickViewProduct.variants.find(v =>
        Object.entries(selectedOptions).every(([key, val]) => v.option_values[key] === val)
      )
      if (matching) {
        variantId = matching.id
        variantPrice = matching.price ?? variantPrice
        variantStock = matching.stock_quantity
      }
    }

    if (quickViewQuantity > variantStock && !quickViewProduct.allow_backorders) return

    addItem({
      id: quickViewProduct.id,
      product_id: quickViewProduct.id,
      variant_id: variantId,
      title: quickViewProduct.title,
      price: variantPrice,
      quantity: quickViewQuantity,
      image: mainImage,
      variant_label: variantLabel,
      sku: quickViewProduct.sku,
      max_quantity: variantStock,
    })
    toast('Added to cart', 'success')
    setQuickViewProduct(null)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-16 py-8 md:py-12">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold">All Products</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">
          {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
        </p>
      </motion.div>

      <div className="flex gap-8">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="w-4 h-4 rounded border-[rgba(0,0,0,0.2)] text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-sm text-[#6B6B6B] group-hover:text-[#1A1A1A] transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-4">Price Range</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={e => updateParams({ priceMin: e.target.value || null })}
                  className="h-9 text-xs"
                />
                <span className="text-[#6B6B6B] self-center">—</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={e => updateParams({ priceMax: e.target.value || null })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-4">Sort By</h3>
              <select
                value={sort}
                onChange={e => updateParams({ sort: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Mobile Filters Button */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <Button
            variant="primary"
            size="md"
            onClick={() => setMobileFiltersOpen(true)}
            className="shadow-lg"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters & Sort
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Active Filter Tags */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2 mb-6"
              >
                <span className="text-xs text-[#6B6B6B]">Active filters:</span>
                {selectedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId)
                  return cat ? (
                    <span key={catId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] text-xs font-medium rounded-full">
                      Category: {cat.name}
                      <button onClick={() => toggleCategory(catId)} className="hover:bg-[#2563EB]/20 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null
                })}
                {priceMin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] text-xs font-medium rounded-full">
                    Min: ${priceMin}
                    <button onClick={() => updateParams({ priceMin: null })} className="hover:bg-[#2563EB]/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {priceMax && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] text-xs font-medium rounded-full">
                    Max: ${priceMax}
                    <button onClick={() => updateParams({ priceMax: null })} className="hover:bg-[#2563EB]/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sort !== 'newest' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] text-xs font-medium rounded-full">
                    Sort: {sortLabel(sort)}
                    <button onClick={() => updateParams({ sort: null })} className="hover:bg-[#2563EB]/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-[#6B6B6B] hover:text-[#DC2626] underline ml-2 transition-colors">
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar: Grid/List Toggle */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#6B6B6B]">
              {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-1 bg-[#F5F5F0] rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'grid' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'list' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Grid / List */}
          {loading ? (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6'
                : 'flex flex-col gap-4'
            )}>
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#F5F5F0] flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-8 h-8 text-[#6B6B6B]" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">No products found</h3>
              <p className="text-sm text-[#6B6B6B] mb-6">Try adjusting your filters.</p>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </motion.div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
                >
                  {products.map(product => (
                    <motion.div key={product.id} variants={fadeUp} className="group relative">
                      <ProductCard product={product} />
                      <button
                        onClick={() => handleQuickViewOpen(product)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:bg-white z-10"
                        aria-label="Quick view"
                      >
                        <Eye className="w-4 h-4 text-[#1A1A1A]" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col gap-4">
                  {products.map(product => {
                    const sp = getSalePrice(product)
                    const mainImage = getImageUrl(product.images?.[0]?.image_url) || '/placeholder.svg'
                    return (
                      <motion.div
                        key={product.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="group relative flex bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.04)] hover:shadow-lg transition-shadow duration-300"
                      >
                        <Link href={`/products/${product.slug}`} className="flex w-full">
                          <div className="relative w-48 md:w-56 shrink-0 aspect-[3/4] bg-[#F5F5F0]">
                            <Image
                              src={mainImage}
                              alt={product.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 40vw, 15vw"
                            />
                          </div>
                          <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">
                                {product.category?.name || 'Accessories'}
                              </p>
                              <h3 className="font-medium text-base md:text-lg truncate">{product.title}</h3>
                              <p className="text-sm text-[#6B6B6B] mt-2 line-clamp-2">
                                {product.description || ''}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                {sp ? (
                                  <>
                                    <span className="font-semibold text-lg">{formatCurrency(sp)}</span>
                                    <span className="text-sm text-[#6B6B6B] line-through">{formatCurrency(product.price)}</span>
                                  </>
                                ) : (
                                  <span className="font-semibold text-lg">{formatCurrency(product.price)}</span>
                                )}
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (product.stock_quantity <= 0) return
                                  const img = getImageUrl(product.images?.[0]?.image_url) || '/placeholder.svg'
                                  addItem({
                                    id: product.id,
                                    product_id: product.id,
                                    variant_id: null,
                                    title: product.title,
                                    price: sp || product.price,
                                    quantity: 1,
                                    image: img,
                                    variant_label: '',
                                    sku: product.sku,
                                    max_quantity: product.stock_quantity,
                                  })
                                  toast('Added to cart', 'success')
                                }}
                              >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleQuickViewOpen(product)}
                          className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:bg-white z-10"
                          aria-label="Quick view"
                        >
                          <Eye className="w-4 h-4 text-[#1A1A1A]" />
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {hasMore && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    loading={loadingMore}
                  >
                    {loadingMore ? (
                      <>Loading...</>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#FAFAFA] p-6 overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-lg font-bold">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-xl hover:bg-[#F5F5F0]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">Sort By</h3>
                  <select
                    value={sort}
                    onChange={e => updateParams({ sort: e.target.value })}
                    className="w-full h-11 px-3 text-sm bg-white border border-[rgba(0,0,0,0.12)] rounded-xl"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="w-4 h-4 rounded border-[rgba(0,0,0,0.2)] text-[#2563EB]"
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-3">Price Range</h3>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={e => updateParams({ priceMin: e.target.value || null })}
                    />
                    <span className="text-[#6B6B6B] self-center">—</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={e => updateParams({ priceMax: e.target.value || null })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button variant="primary" className="w-full" onClick={() => setMobileFiltersOpen(false)}>
                  Apply Filters
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { clearFilters(); setMobileFiltersOpen(false) }}>
                  Clear All
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <Modal isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} size="xl">
        {quickViewProduct && (
          <div className="flex flex-col md:flex-row">
            {/* Image Gallery */}
            <div className="md:w-1/2 p-6">
              <div className="relative aspect-square bg-[#F5F5F0] rounded-xl overflow-hidden mb-3">
                <Image
                  src={getImageUrl(quickViewProduct.images?.[selectedImageIndex]?.image_url) || '/placeholder.svg'}
                  alt={quickViewProduct.images?.[selectedImageIndex]?.alt_text || quickViewProduct.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {quickViewProduct.images && quickViewProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {quickViewProduct.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={cn(
                        'relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                        idx === selectedImageIndex ? 'border-[#2563EB]' : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <Image
                        src={getImageUrl(img.image_url) || '/placeholder.svg'}
                        alt={img.alt_text || `${quickViewProduct.title} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="md:w-1/2 p-6 flex flex-col">
              <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">
                {quickViewProduct.category?.name || 'Accessories'}
              </p>
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-2">{quickViewProduct.title}</h2>

              <div className="flex items-center gap-2 mb-4">
                {(() => {
                  const sp = getSalePrice(quickViewProduct)
                  return sp ? (
                    <>
                      <span className="text-xl font-semibold text-[#DC2626]">{formatCurrency(sp)}</span>
                      <span className="text-sm text-[#6B6B6B] line-through">{formatCurrency(quickViewProduct.price)}</span>
                    </>
                  ) : (
                    <span className="text-xl font-semibold">{formatCurrency(quickViewProduct.price)}</span>
                  )
                })()}
              </div>

              {quickViewProduct.description && (
                <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6 line-clamp-4">
                  {quickViewProduct.description}
                </p>
              )}

              {/* Options / Variants */}
              {quickViewProduct.options && quickViewProduct.options.length > 0 && (
                <div className="space-y-4 mb-6">
                  {quickViewProduct.options.map(opt => (
                    <div key={opt.id}>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-2">
                        {opt.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {opt.values?.map(val => (
                          <button
                            key={val.id}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val.value }))}
                            className={cn(
                              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                              selectedOptions[opt.name] === val.value
                                ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#2563EB]'
                                : 'border-[rgba(0,0,0,0.12)] text-[#6B6B6B] hover:border-[rgba(0,0,0,0.3)]'
                            )}
                          >
                            {val.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mt-auto flex items-center gap-4">
                <QuantitySelector
                  value={quickViewQuantity}
                  onChange={setQuickViewQuantity}
                  max={quickViewProduct.stock_quantity || 99}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleQuickViewAddToCart}
                  disabled={quickViewProduct.stock_quantity <= 0}
                  className="flex-1"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {quickViewProduct.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
