import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Package, CheckCircle2,
  X, ScanBarcode, AlertTriangle, Loader2, ReceiptText,
} from 'lucide-react'
import api from '../../../api/client'
import './POS.css'

const LOW_STOCK_THRESHOLD = 5

const CATEGORY_RULES = [
  { prefix: 'BEV', label: 'Beverages', tone: 'blue' },
  { prefix: 'SNK', label: 'Snacks', tone: 'amber' },
  { prefix: 'DRY', label: 'Dairy', tone: 'green' },
  { prefix: 'BKY', label: 'Bakery', tone: 'rose' },
]

function getCategory(sku) {
  const prefix = (sku || '').split('-')[0].toUpperCase()
  const rule = CATEGORY_RULES.find((entry) => entry.prefix === prefix)
  return rule || { prefix: prefix || 'OTH', label: 'Other', tone: 'slate' }
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null
  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl
  }
  const apiBase = api?.defaults?.baseURL || ''
  const origin = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '')
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${origin}${path}`
}

// Falls back to a placeholder icon if there's no photo or it fails to load
function ProductThumb({ src, name, tone }) {
  const resolved = resolveImageUrl(src)
  const [status, setStatus] = useState(resolved ? 'loading' : 'empty')

  if (!resolved || status === 'error' || status === 'empty') {
    return (
      <div className={`pos-product-image pos-product-image-empty cat-${tone}`}>
        <Package size={24} />
      </div>
    )
  }

  return (
    <div className="pos-product-image">
      <img
        src={resolved}
        alt={name}
        loading="lazy"
        onLoad={(event) => setStatus(event.target.naturalWidth === 0 ? 'error' : 'loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  )
}

export default function POS() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [scanFeedback, setScanFeedback] = useState(null)
  const searchInputRef = useRef(null)

  const loadProducts = async () => {
    setLoadingProducts(true)
    setLoadError('')
    try {
      const response = await api.get('/products')
      setProducts(response.data.data || response.data || [])
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const categories = useMemo(() => {
    const counts = new Map()
    products.forEach((product) => {
      const category = getCategory(product.sku)
      const existing = counts.get(category.label)
      if (existing) {
        existing.count += 1
      } else {
        counts.set(category.label, { ...category, count: 1 })
      }
    })
    return Array.from(counts.values()).sort((a, b) => b.count - a.count)
  }, [products])

  const addToCart = (product, options = {}) => {
    const { silent = false } = options
    if (product.quantity < 1) {
      if (!silent) {
        setScanFeedback({ type: 'error', message: `"${product.name}" is out of stock` })
      }
      return false
    }

    let added = true
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          added = false
          return prev
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })

    if (!added && !silent) {
      setScanFeedback({ type: 'error', message: `No more "${product.name}" available to add` })
    } else if (added && silent) {
      setScanFeedback({ type: 'success', message: `Added "${product.name}"` })
    }
    return added
  }

  const updateCartQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item
          const product = products.find((p) => p.id === id)
          const nextQty = item.quantity + delta
          if (nextQty < 1) return item
          if (product && nextQty > product.quantity) return item
          return { ...item, quantity: nextQty }
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return products.filter((product) => {
      const category = getCategory(product.sku)
      const matchesCategory = selectedCategory === 'All' || category.label === selectedCategory
      if (!matchesCategory) return false
      if (!term) return true
      const name = (product.name || '').toLowerCase()
      const sku = (product.sku || '').toLowerCase()
      return name.includes(term) || sku.includes(term)
    })
  }, [products, searchTerm, selectedCategory])

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return
    const term = searchTerm.trim().toLowerCase()
    if (!term) return
    const exactMatch = products.find((product) => (product.sku || '').toLowerCase() === term)
    if (exactMatch) {
      addToCart(exactMatch, { silent: true })
      setSearchTerm('')
      searchInputRef.current?.focus()
    } else {
      setScanFeedback({ type: 'error', message: `No product found for code "${searchTerm.trim()}"` })
    }
  }

  useEffect(() => {
    if (!scanFeedback) return
    const timer = setTimeout(() => setScanFeedback(null), 2400)
    return () => clearTimeout(timer)
  }, [scanFeedback])

  const completeSale = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/sales', {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      })
      setCart([])
      setShowSuccess(true)
      loadProducts()
      setTimeout(() => setShowSuccess(false), 2200)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete this sale')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pos-page">
      <div className="pos-catalog">
        <div className="pos-catalog-header">
          <div>
            <span className="page-eyebrow">Point of Sale</span>
            <h1 className="page-title">Checkout</h1>
          </div>
        </div>

        <div className="search-row">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name or SKU…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => { setSearchTerm(''); searchInputRef.current?.focus() }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="search-hint">
            <ScanBarcode size={13} /> Press Enter to add an exact SKU match
          </span>
        </div>

        {categories.length > 1 && (
          <div className="category-bar">
            <button
              type="button"
              className={`category-chip ${selectedCategory === 'All' ? 'is-active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All
              <span className="category-chip-count">{products.length}</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                className={`category-chip cat-${category.tone} ${selectedCategory === category.label ? 'is-active' : ''}`}
                onClick={() => setSelectedCategory(category.label)}
              >
                {category.label}
                <span className="category-chip-count">{category.count}</span>
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {scanFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className={`scan-toast ${scanFeedback.type === 'success' ? 'scan-toast-success' : 'scan-toast-error'}`}
            >
              {scanFeedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        {loadError && (
          <div className="scan-toast scan-toast-error">
            <AlertTriangle size={13} />
            {loadError}
            <button type="button" className="pos-retry-btn" onClick={loadProducts}>Retry</button>
          </div>
        )}

        {loadingProducts ? (
          <div className="product-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="pos-product-card pos-product-skeleton">
                <div className="pos-skeleton-block" />
                <div className="pos-skeleton-line" />
                <div className="pos-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="pos-empty-state">
            <Package size={30} />
            <p>No matching products</p>
            <span>{searchTerm ? `Try a different search than "${searchTerm}"` : 'No products in this category yet'}</span>
          </div>
        ) : (
          // no fixed height and no internal scroll here — every filtered
          // product renders in the grid at once
          <div className="product-grid">
            {filteredProducts.map((product, index) => {
              const inCart = cart.find((item) => item.id === product.id)
              const isOutOfStock = product.quantity < 1
              const isLowStock = !isOutOfStock && product.quantity <= LOW_STOCK_THRESHOLD
              const category = getCategory(product.sku)
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 20) * 0.02, duration: 0.25 }}
                  whileHover={!isOutOfStock ? { y: -4 } : {}}
                  className={`pos-product-card ${isOutOfStock ? 'pos-product-disabled' : ''}`}
                  title={`SKU: ${product.sku}`}
                >
                  <div className="pos-product-image-wrap">
                    <ProductThumb src={product.image_url} name={product.name} tone={category.tone} />
                    <span className={`pos-category-pill cat-${category.tone}`}>{category.label}</span>
                    <AnimatePresence>
                      {inCart && (
                        <motion.span
                          key={inCart.quantity}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                          className="pos-product-badge"
                        >
                          {inCart.quantity}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="pos-product-body">
                    <p className="pos-product-name">{product.name}</p>
                    <span className="pos-product-sku">SKU {product.sku}</span>
                    <div className="pos-product-footer">
                      <span className="pos-product-price">{formatCurrency(product.price)}</span>
                      <span className={`pos-stock-pill ${isOutOfStock ? 'pos-stock-out' : ''} ${isLowStock ? 'pos-stock-low' : ''}`}>
                        {isOutOfStock ? 'Out of stock' : `${product.quantity} left`}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="pos-add-btn"
                      disabled={isOutOfStock}
                      onClick={(event) => {
                        event.stopPropagation()
                        addToCart(product)
                      }}
                    >
                      <Plus size={13} /> Add to cart
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <div className="pos-cart">
        <div className="pos-cart-header">
          <div className="pos-cart-header-icon">
            <ShoppingCart size={17} />
          </div>
          <div className="pos-cart-header-text">
            <h3>Current sale</h3>
            <span>
              {cartItemCount === 0
                ? 'No items yet'
                : `${cartItemCount} item${cartItemCount === 1 ? '' : 's'} · ${cart.length} product${cart.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <span className="pos-cart-count">{cartItemCount}</span>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <ShoppingCart size={26} />
              <p>Cart is empty</p>
              <span>Tap a product to add it to the sale</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 14, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 14, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="pos-cart-item"
                >
                  <div className="pos-cart-item-info">
                    <span className="pos-cart-item-name">{item.name}</span>
                    <span className="pos-cart-item-price">{formatCurrency(item.price)} each</span>
                  </div>
                  <div className="pos-cart-item-controls">
                    <button type="button" onClick={() => updateCartQuantity(item.id, -1)} aria-label="Decrease quantity">
                      <Minus size={12} />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateCartQuantity(item.id, 1)} aria-label="Increase quantity">
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="pos-cart-item-total">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button type="button" className="pos-cart-item-remove" onClick={() => removeFromCart(item.id)} aria-label="Remove item">
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {error && <p className="pos-error">{error}</p>}

        <div className="pos-cart-footer">
          <div className="pos-cart-total-row">
            <span>Total</span>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          <button
            type="button"
            className="btn-complete-sale"
            disabled={cart.length === 0 || submitting}
            onClick={completeSale}
          >
            {submitting ? (
              <span className="pos-btn-loading">
                <Loader2 size={16} className="pos-spin" /> Processing…
              </span>
            ) : (
              <span className="pos-btn-loading">
                <ReceiptText size={16} /> Complete sale
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="pos-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pos-success-card"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 16 }}
                className="pos-success-icon"
              >
                <CheckCircle2 size={40} />
              </motion.span>
              <p>Sale completed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}