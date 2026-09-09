import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Trash2, Truck, Package, ChevronDown, DollarSign, Calendar,
  ShoppingBag, Boxes, PenLine, Check, Loader2, ImagePlus, Tag, Layers,
  Minus, ListPlus, ScanBarcode, Search, AlertCircle,
} from 'lucide-react'
import api from '../../../api/client'
import './Purchases.css'

const SUPPLIER_ACCENTS = ['accent-indigo', 'accent-emerald', 'accent-cyan', 'accent-amber', 'accent-rose']

const emptyNewProduct = {
  name: '', sku: '', price: '', category_name: '', supplier_name: '', imageFile: null, imagePreview: null,
}

const createEmptyItem = (defaultProductId = '') => ({
  mode: 'existing',
  product_id: defaultProductId,
  quantity: '',
  unit_cost: '',
  newProduct: { ...emptyNewProduct },
})

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [supplierId, setSupplierId] = useState('')
  const [isNewSupplier, setIsNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [items, setItems] = useState([createEmptyItem()])

  const [activeImageIndex, setActiveImageIndex] = useState(null)
  const itemImageInputRef = useRef(null)

  const loadData = async () => {
    setLoadingData(true)
    const [purchasesRes, productsRes, suppliersRes] = await Promise.all([
      api.get('/purchases'),
      api.get('/products'),
      api.get('/suppliers'),
    ])
    setPurchases(purchasesRes.data.data || purchasesRes.data)
    setProducts(productsRes.data.data || productsRes.data)
    setSuppliers(suppliersRes.data)
    setLoadingData(false)
  }

  useEffect(() => { loadData() }, [])

  const openForm = () => {
    setSupplierId(suppliers[0]?.id || '')
    setIsNewSupplier(false)
    setNewSupplierName('')
    setItems([createEmptyItem(products[0]?.id || '')])
    setError('')
    setShowForm(true)
  }

  const addItemRow = () => {
    setItems([...items, createEmptyItem(products[0]?.id || '')])
  }

  const removeItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  // Keeps the quantity stepper and the typed number input in perfect sync,
  // and never lets the value drop below zero.
  const adjustQuantity = (index, delta) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      const current = parseInt(item.quantity, 10) || 0
      const next = Math.max(0, current + delta)
      return { ...item, quantity: String(next) }
    }))
  }

  const updateNewProductField = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (
      i === index ? { ...item, newProduct: { ...item.newProduct, [field]: value } } : item
    )))
  }

  const resolveCurrentSupplierName = () => {
    if (isNewSupplier) return newSupplierName.trim()
    return suppliers.find((supplier) => String(supplier.id) === String(supplierId))?.name || ''
  }

  // Switches a single item row between "pick an existing product" and
  // "create a brand-new product right here". Flipping into "new" mode
  // pre-fills the fiddly required fields (SKU / category / supplier) with
  // sensible defaults so the person only really has to type a name and a
  // price — everything else is editable if they want to change it.
  const toggleItemMode = (index, mode) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index || item.mode === mode) return item
      if (mode === 'existing') return { ...item, mode: 'existing' }
      return {
        ...item,
        mode: 'new',
        newProduct: {
          ...item.newProduct,
          sku: item.newProduct.sku || `SKU-${Date.now().toString().slice(-6)}`,
          category_name: item.newProduct.category_name || 'General',
          supplier_name: item.newProduct.supplier_name || resolveCurrentSupplierName(),
          price: item.newProduct.price || item.unit_cost || '',
        },
      }
    }))
  }

  const triggerItemPhotoUpload = (index) => {
    setActiveImageIndex(index)
    itemImageInputRef.current?.click()
  }

  const handleItemImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file || activeImageIndex === null) return
    updateNewProductField(activeImageIndex, 'imageFile', file)
    updateNewProductField(activeImageIndex, 'imagePreview', URL.createObjectURL(file))
    event.target.value = ''
  }

  const lineTotal = (item) => {
    const quantity = parseFloat(item.quantity) || 0
    const cost = parseFloat(item.unit_cost) || 0
    return quantity * cost
  }

  const calculateTotal = () => items.reduce((sum, item) => sum + lineTotal(item), 0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (isNewSupplier ? !newSupplierName.trim() : !supplierId) {
      setError('Please choose or enter a supplier before saving')
      return
    }

    const hasInvalidItem = items.some((item) => {
      if (!item.quantity || !item.unit_cost) return true
      if (item.mode === 'existing') return !item.product_id
      return !item.newProduct.name.trim() || !item.newProduct.price
    })
    if (hasInvalidItem) {
      setError('Please fill in every item — new products need at least a name and a price')
      return
    }

    setSubmitting(true)
    try {
      let finalSupplierId = supplierId

      if (isNewSupplier) {
        const supplierRes = await api.post('/suppliers', { name: newSupplierName.trim() })
        finalSupplierId = supplierRes.data.id
      }

      // Any item marked "new" doesn't have a product yet — create it first
      // (same endpoint and FormData approach as the Products page, so it
      // shows up there right away too), then use the id that comes back.
      const resolvedItems = []
      for (const item of items) {
        let productId = item.product_id

        if (item.mode === 'new') {
          const productPayload = new FormData()
          productPayload.append('name', item.newProduct.name.trim())
          productPayload.append('sku', item.newProduct.sku.trim())
          productPayload.append('price', item.newProduct.price)
          productPayload.append('quantity', 0)
          productPayload.append('min_stock', 5)
          productPayload.append('category_name', item.newProduct.category_name.trim())
          productPayload.append('supplier_name', item.newProduct.supplier_name.trim())
          if (item.newProduct.imageFile) productPayload.append('image', item.newProduct.imageFile)

          const productRes = await api.post('/products', productPayload)
          productId = productRes.data?.id ?? productRes.data?.data?.id
        }

        resolvedItems.push({
          product_id: productId,
          quantity: Number(item.quantity),
          unit_cost: Number(item.unit_cost),
        })
      }

      await api.post('/purchases', {
        supplier_id: finalSupplierId,
        items: resolvedItems,
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while saving this purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSpent = purchases.reduce((sum, purchase) => sum + Number(purchase.total), 0)
  const activeSupplierCount = new Set(purchases.map((p) => p.supplier)).size

  return (
    <div className="purchases-page">
      <div className="purchases-header">
        <div>
          <span className="page-eyebrow">
            <Boxes size={13} /> Inventory
          </span>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Restock your inventory by recording deliveries from suppliers</p>
        </div>
        <motion.button
          className="btn-primary"
          onClick={openForm}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} /> New purchase
        </motion.button>
      </div>

      <div className="purchases-summary-row">
        <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="summary-icon summary-icon-blue"><ShoppingBag size={16} /></div>
          <div>
            <p className="summary-value">{purchases.length}</p>
            <p className="summary-label">Total purchases</p>
          </div>
        </motion.div>

        <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="summary-icon summary-icon-green"><DollarSign size={16} /></div>
          <div>
            <p className="summary-value">${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="summary-label">Total spent</p>
          </div>
        </motion.div>

        <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="summary-icon summary-icon-purple"><Truck size={16} /></div>
          <div>
            <p className="summary-value">{activeSupplierCount}</p>
            <p className="summary-label">Suppliers used</p>
          </div>
        </motion.div>
      </div>

      <div className="purchases-list">
        {loadingData ? (
          <div className="purchases-loading">
            <div className="loading-card" />
            <div className="loading-card" />
            <div className="loading-card" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Boxes size={26} /></div>
            <p>No purchases recorded yet</p>
            <span>Create your first purchase to start tracking restocks</span>
            <button type="button" className="btn-primary empty-state-cta" onClick={openForm}>
              <Plus size={15} /> New purchase
            </button>
          </div>
        ) : (
          purchases.map((purchase, index) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              className={`purchase-card ${SUPPLIER_ACCENTS[index % SUPPLIER_ACCENTS.length]}`}
            >
              <div className="purchase-card-icon">
                <Truck size={18} />
              </div>
              <div className="purchase-card-body">
                <div className="purchase-card-top">
                  <span className="purchase-supplier">{purchase.supplier}</span>
                  <span className="purchase-total">${purchase.total}</span>
                </div>
                <p className="purchase-date">
                  <Calendar size={11} />
                  {new Date(purchase.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <div className="purchase-items">
                  {purchase.items?.map((item, i) => (
                    <span key={i} className="purchase-item-chip">
                      <Package size={11} />
                      {item.product} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
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
              className="purchase-form"
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleSubmit}
            >
              <div className="form-header">
                <div className="form-header-icon"><Truck size={17} /></div>
                <div className="form-header-text">
                  <h3>New purchase</h3>
                  <p>Record stock coming in from a supplier</p>
                </div>
                <button type="button" className="form-close" onClick={() => setShowForm(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="form-scroll">

                {/* ── Supplier ─────────────────────────────── */}
                <div className="field-group">
                  <label className="field-label">Who is this delivery from?</label>

                  <div className="segmented-toggle">
                    <button
                      type="button"
                      className={!isNewSupplier ? 'segmented-btn is-active' : 'segmented-btn'}
                      onClick={() => { setIsNewSupplier(false); setError('') }}
                    >
                      <Truck size={13} /> Existing supplier
                    </button>
                    <button
                      type="button"
                      className={isNewSupplier ? 'segmented-btn is-active' : 'segmented-btn'}
                      onClick={() => { setIsNewSupplier(true); setError('') }}
                    >
                      <PenLine size={13} /> New supplier
                    </button>
                  </div>

                  {isNewSupplier ? (
                    <div className="input-with-icon">
                      <PenLine size={14} />
                      <input
                        type="text"
                        placeholder="e.g. Northgate Distributors"
                        className="form-input"
                        value={newSupplierName}
                        onChange={(event) => setNewSupplierName(event.target.value)}
                      />
                    </div>
                  ) : suppliers.length === 0 ? (
                    <p className="field-hint field-hint-warning">
                      <AlertCircle size={13} /> You don't have any suppliers yet — switch to "New supplier" above.
                    </p>
                  ) : (
                    <div className="select-wrap">
                      <select
                        className="form-select"
                        value={supplierId}
                        onChange={(event) => setSupplierId(event.target.value)}
                        required
                      >
                        <option value="" disabled>Select a supplier…</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="select-chevron" />
                    </div>
                  )}
                </div>

                {/* ── Items ────────────────────────────────── */}
                <div className="items-section">
                  <div className="field-label-row">
                    <label className="field-label">What's in the delivery?</label>
                    <span className="items-count-pill">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="items-list">
                    {items.map((item, index) => (
                      <div key={index} className="item-card">
                        <div className="item-card-header">
                          <span className="item-card-title">Item {index + 1}</span>
                          <button
                            type="button"
                            className="item-remove"
                            onClick={() => removeItemRow(index)}
                            disabled={items.length === 1}
                            title={items.length === 1 ? 'At least one item is required' : 'Remove this item'}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        <div className="item-card-body">
                          <div className="field-group field-group-tight">
                            <label className="field-label field-label-sm">Product</label>

                            <div className="segmented-toggle segmented-toggle-sm">
                              <button
                                type="button"
                                className={item.mode === 'existing' ? 'segmented-btn is-active' : 'segmented-btn'}
                                onClick={() => toggleItemMode(index, 'existing')}
                              >
                                <Search size={12} /> Pick existing
                              </button>
                              <button
                                type="button"
                                className={item.mode === 'new' ? 'segmented-btn is-active' : 'segmented-btn'}
                                onClick={() => toggleItemMode(index, 'new')}
                              >
                                <ListPlus size={12} /> Add new product
                              </button>
                            </div>

                            {item.mode === 'existing' ? (
                              products.length === 0 ? (
                                <p className="field-hint field-hint-warning">
                                  <AlertCircle size={13} /> No products yet — use "Add new product" instead.
                                </p>
                              ) : (
                                <div className="select-wrap">
                                  <select
                                    className="form-select"
                                    value={item.product_id}
                                    onChange={(event) => updateItem(index, 'product_id', event.target.value)}
                                  >
                                    <option value="" disabled>Select a product…</option>
                                    {products.map((product) => (
                                      <option key={product.id} value={product.id}>
                                        {product.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown size={15} className="select-chevron" />
                                </div>
                              )
                            ) : (
                              <div className="item-new-product-panel">
                                <button
                                  type="button"
                                  className="item-photo-btn"
                                  onClick={() => triggerItemPhotoUpload(index)}
                                  title="Add a photo"
                                >
                                  {item.newProduct.imagePreview ? (
                                    <img src={item.newProduct.imagePreview} alt="Preview" className="item-photo-preview" />
                                  ) : (
                                    <>
                                      <ImagePlus size={17} />
                                      <span>Photo</span>
                                    </>
                                  )}
                                </button>

                                <div className="item-new-product-fields">
                                  <div className="field-group field-group-tight">
                                    <label className="field-label field-label-sm">Name</label>
                                    <div className="input-with-icon">
                                      <Tag size={13} />
                                      <input
                                        type="text"
                                        placeholder="Product name"
                                        className="form-input"
                                        value={item.newProduct.name}
                                        onChange={(event) => updateNewProductField(index, 'name', event.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="field-group field-group-tight">
                                    <label className="field-label field-label-sm">Sale price</label>
                                    <div className="input-with-icon">
                                      <DollarSign size={13} />
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="form-input"
                                        value={item.newProduct.price}
                                        onChange={(event) => updateNewProductField(index, 'price', event.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="field-group field-group-tight">
                                    <label className="field-label field-label-sm">SKU</label>
                                    <div className="input-with-icon">
                                      <ScanBarcode size={13} />
                                      <input
                                        type="text"
                                        placeholder="SKU"
                                        className="form-input"
                                        value={item.newProduct.sku}
                                        onChange={(event) => updateNewProductField(index, 'sku', event.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="field-group field-group-tight">
                                    <label className="field-label field-label-sm">Category</label>
                                    <div className="input-with-icon">
                                      <Layers size={13} />
                                      <input
                                        type="text"
                                        placeholder="Category"
                                        className="form-input"
                                        value={item.newProduct.category_name}
                                        onChange={(event) => updateNewProductField(index, 'category_name', event.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="field-group field-group-tight item-new-product-supplier">
                                    <label className="field-label field-label-sm">Product supplier</label>
                                    <div className="input-with-icon">
                                      <Truck size={13} />
                                      <input
                                        type="text"
                                        placeholder="Who makes/sells this product"
                                        className="form-input"
                                        value={item.newProduct.supplier_name}
                                        onChange={(event) => updateNewProductField(index, 'supplier_name', event.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="item-qty-cost-row">
                            <div className="field-group field-group-tight">
                              <label className="field-label field-label-sm">Quantity received</label>
                              <div className="stepper-input">
                                <button
                                  type="button"
                                  className="stepper-btn"
                                  onClick={() => adjustQuantity(index, -1)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="stepper-value"
                                  value={item.quantity}
                                  onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                />
                                <button
                                  type="button"
                                  className="stepper-btn"
                                  onClick={() => adjustQuantity(index, 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="field-group field-group-tight">
                              <label className="field-label field-label-sm">Cost per unit</label>
                              <div className="input-with-icon">
                                <DollarSign size={14} />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="form-input"
                                  value={item.unit_cost}
                                  onChange={(event) => updateItem(index, 'unit_cost', event.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="item-card-footer">
                          <span>Line total</span>
                          <strong>${lineTotal(item).toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <input
                    ref={itemImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleItemImageSelect}
                    style={{ display: 'none' }}
                  />

                  <button type="button" className="btn-add-item" onClick={addItemRow}>
                    <Plus size={14} /> Add another item
                  </button>
                </div>

                {error && (
                  <p className="form-error">
                    <AlertCircle size={14} /> {error}
                  </p>
                )}
              </div>

              <div className="form-footer">
                <div className="form-total">
                  <span>Total</span>
                  <strong>${calculateTotal().toFixed(2)}</strong>
                </div>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="spin-icon" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Complete purchase
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}