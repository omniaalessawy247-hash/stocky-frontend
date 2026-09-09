import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, X, ImagePlus, Minus, Search, Package,
  Tag, Hash, DollarSign, Layers, Truck, AlertTriangle, Loader2,
} from 'lucide-react'
import api from '../../../api/client'
import { useAuth } from '../../../context/AuthContext'
import './Products.css'

const emptyForm = {
  name: '', sku: '', price: '', quantity: 0, min_stock: 5, category_name: '', supplier_name: '',
}

export default function Products() {
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'manager'
  const fileInputRef = useRef(null)

  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const normalizeProducts = (payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.data)) return payload.data.data
    return []
  }

  const loadProducts = async () => {
    setLoadError('')
    try {
      const response = await api.get('/products')
      setProducts(normalizeProducts(response.data))
    } catch (err) {
      setProducts([])
      setLoadError('Could not load products, please try again')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setEditingId(null)
    setError('')
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (product) => {
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
      min_stock: product.min_stock,
      category_name: product.category || '',
      supplier_name: product.supplier || '',
    })
    setImagePreview(product.image_url || null)
    setImageFile(null)
    setEditingId(product.id)
    setError('')
    setShowForm(true)
  }

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const adjustNumber = (field, delta, min = 0) => {
    setForm((prev) => ({ ...prev, [field]: Math.max(min, Number(prev[field] || 0) + delta) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name || !form.sku || !form.price || !form.category_name || !form.supplier_name) {
      setError('Please fill in every field before saving')
      return
    }

    setSubmitting(true)
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    if (imageFile) payload.append('image', imageFile)
    if (editingId) payload.append('_method', 'PUT')

    try {
      if (editingId) {
        await api.post(`/products/${editingId}`, payload)
      } else {
        await api.post('/products', payload)
      }
      setShowForm(false)
      resetForm()
      await loadProducts()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while saving this product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product permanently?')) return
    try {
      await api.delete(`/products/${id}`)
      await loadProducts()
    } catch (err) {
      setLoadError('Could not delete this product, please try again')
    }
  }

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase()
    return (
      product.name?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      (product.category || '').toLowerCase().includes(term)
    )
  })

  const totalValue = products.reduce((sum, product) => sum + Number(product.price) * Number(product.quantity), 0)
  const lowStockCount = products.filter((product) => product.stock_status === 'low').length

  return (
    <div className="products-page">
      <div className="products-header">
        <div>
          <span className="page-eyebrow">Inventory</span>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Everything currently tracked in your inventory</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openAddForm}>
            <Plus size={16} /> Add product
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-indigo">
          <span className="stat-card-icon"><Package size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">{products.length}</span>
            <span className="stat-card-label">Products tracked</span>
          </div>
        </div>

        <div className="stat-card stat-card-teal">
          <span className="stat-card-icon"><DollarSign size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="stat-card-label">Inventory value</span>
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <span className="stat-card-icon"><AlertTriangle size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">{lowStockCount}</span>
            <span className="stat-card-label">Running low</span>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, SKU or category…"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {loadError && (
        <div className="page-alert">
          <AlertTriangle size={15} />
          <span>{loadError}</span>
          <button type="button" onClick={loadProducts}>Retry</button>
        </div>
      )}

      <div className="products-grid">
        {loading && (
          <div className="products-loading">
            <Loader2 size={22} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -6 }}
            className="product-card"
          >
            <div className="product-image-wrap">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="product-image" />
              ) : (
                <div className="product-image-placeholder">
                  <Package size={26} />
                </div>
              )}
              <span className={`stock-pill ${product.stock_status === 'low' ? 'stock-pill-low' : 'stock-pill-ok'}`}>
                {product.stock_status === 'low' ? 'Low stock' : 'In stock'}
              </span>
            </div>

            <div className="product-card-body">
              <h3 className="product-name">{product.name}</h3>

              <div className="product-meta-row">
                <span className="meta-chip meta-chip-blue"><Hash size={11} /> {product.sku}</span>
                <span className="meta-chip meta-chip-purple"><Layers size={11} /> {product.category}</span>
              </div>

              <div className="product-card-bottom">
                <span className="product-price">${product.price}</span>
                <span className="product-qty-pill">{product.quantity} units</span>
              </div>

              {canEdit && (
                <div className="product-actions">
                  <button className="action-btn" onClick={() => openEditForm(product)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button className="action-btn action-btn-danger" onClick={() => handleDelete(product.id)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {!loading && filteredProducts.length === 0 && (
          <div className="products-empty">
            <Package size={30} />
            <p>No products match your search</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.form
              className="modal-form"
              initial={{ scale: 0.9, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26, mass: 0.9 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleSubmit}
            >
              <div className="modal-header">
                <div className="modal-header-icon">
                  <Package size={18} />
                </div>
                <div className="modal-header-text">
                  <h3>{editingId ? 'Edit product' : 'Add a new product'}</h3>
                  <p>Fill in every detail below to keep your inventory accurate</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setShowForm(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-scroll">
                <div className="form-section form-section-photo">
                  <p className="form-section-title"><ImagePlus size={13} /> Photo</p>
                  <div className="photo-upload">
                    <button
                      type="button"
                      className="photo-upload-square"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      ) : (
                        <ImagePlus size={22} />
                      )}
                    </button>

                    <div className="photo-upload-text">
                      <p className="photo-upload-title">Product photo</p>
                      <p className="photo-upload-hint">PNG or JPG, up to 5MB</p>
                      <div className="photo-upload-actions">
                        <button type="button" className="photo-upload-link" onClick={() => fileInputRef.current?.click()}>
                          {imagePreview ? 'Change photo' : 'Upload photo'}
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            className="photo-upload-link photo-upload-remove"
                            onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="form-section form-section-basic">
                  <p className="form-section-title"><Tag size={13} /> Basic details</p>

                  <div className="field-group">
                    <label className="field-label">Product name</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-badge badge-indigo"><Tag size={14} /></span>
                      <input
                        className="form-input form-input-icon"
                        placeholder="e.g. Cola 330ml"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">SKU (product code)</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-badge badge-blue"><Hash size={14} /></span>
                      <input
                        className="form-input form-input-icon"
                        placeholder="e.g. BEV-001"
                        value={form.sku}
                        onChange={(event) => setForm({ ...form, sku: event.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section form-section-pricing">
                  <p className="form-section-title"><DollarSign size={13} /> Pricing & category</p>

                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label">Price</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon-badge badge-green"><DollarSign size={14} /></span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input form-input-icon"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(event) => setForm({ ...form, price: event.target.value })}
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Category</label>
                      <div className="input-icon-wrap">
                        <span className="input-icon-badge badge-purple"><Layers size={14} /></span>
                        <input
                          className="form-input form-input-icon"
                          placeholder="e.g. Beverages"
                          value={form.category_name}
                          onChange={(event) => setForm({ ...form, category_name: event.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Supplier</label>
                    <div className="input-icon-wrap">
                      <span className="input-icon-badge badge-orange"><Truck size={14} /></span>
                      <input
                        className="form-input form-input-icon"
                        placeholder="e.g. Nile Trading Co."
                        value={form.supplier_name}
                        onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section form-section-stock">
                  <p className="form-section-title"><Package size={13} /> Stock levels</p>

                  <div className="field-row">
                    <div className="field-group">
                      <label className="field-label"><Package size={13} /> Quantity in stock</label>
                      <div className="stepper stepper-indigo">
                        <button type="button" onClick={() => adjustNumber('quantity', -1)}><Minus size={14} /></button>
                        <span>{form.quantity}</span>
                        <button type="button" onClick={() => adjustNumber('quantity', 1)}><Plus size={14} /></button>
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label"><AlertTriangle size={13} /> Minimum stock alert</label>
                      <div className="stepper stepper-amber">
                        <button type="button" onClick={() => adjustNumber('min_stock', -1, 1)}><Minus size={14} /></button>
                        <span>{form.min_stock}</span>
                        <button type="button" onClick={() => adjustNumber('min_stock', 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <p className="form-error">{error}</p>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (<><Loader2 size={15} className="spin" /> Saving…</>) : editingId ? 'Save changes' : 'Add product'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}