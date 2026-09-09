import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Trash2, Phone, Package2, Truck, Building2, Check, Loader2,
  AlertCircle, UserRound,
} from 'lucide-react'
import api from '../../../api/client'
import './Suppliers.css'

const ACCENTS = ['accent-indigo', 'accent-emerald', 'accent-cyan', 'accent-amber', 'accent-rose']

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Instead of the browser's native confirm()/alert(), removal goes through
  // its own small modal so the whole flow stays inside the app's own look
  // and feel and can show a real error message if it fails.
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadSuppliers = async () => {
    setLoadingData(true)
    const response = await api.get('/suppliers')
    setSuppliers(response.data)
    setLoadingData(false)
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const openForm = () => {
    setName('')
    setPhone('')
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/suppliers', { name, phone })
      setShowForm(false)
      loadSuppliers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add supplier')
    } finally {
      setSubmitting(false)
    }
  }

  const requestDelete = (supplier) => {
    setDeleteError('')
    setPendingDelete(supplier)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/suppliers/${pendingDelete.id}`)
      setPendingDelete(null)
      loadSuppliers()
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to remove supplier')
    } finally {
      setDeleting(false)
    }
  }

  const totalProducts = suppliers.reduce((sum, supplier) => sum + (supplier.products_count || 0), 0)

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <div>
          <span className="page-eyebrow">
            <Truck size={13} /> Vendors
          </span>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage the vendors you buy stock from</p>
        </div>
        <motion.button
          className="btn-primary"
          onClick={openForm}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
          Add supplier
        </motion.button>
      </div>

      {!loadingData && suppliers.length > 0 && (
        <div className="suppliers-summary-row">
          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="summary-icon summary-icon-indigo"><Building2 size={16} /></div>
            <div>
              <p className="summary-value">{suppliers.length}</p>
              <p className="summary-label">Suppliers</p>
            </div>
          </motion.div>
          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="summary-icon summary-icon-emerald"><Package2 size={16} /></div>
            <div>
              <p className="summary-value">{totalProducts}</p>
              <p className="summary-label">Linked products</p>
            </div>
          </motion.div>
        </div>
      )}

      {loadingData ? (
        <div className="suppliers-loading">
          <div className="loading-card" />
          <div className="loading-card" />
          <div className="loading-card" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Truck size={26} /></div>
          <p>No suppliers added yet</p>
          <span>Add your first vendor to start recording purchases from them</span>
          <button type="button" className="btn-primary empty-state-cta" onClick={openForm}>
            <Plus size={15} /> Add supplier
          </button>
        </div>
      ) : (
        <div className="suppliers-grid">
          {suppliers.map((supplier, index) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -3 }}
              className={`supplier-card ${ACCENTS[index % ACCENTS.length]}`}
            >
              <div className="supplier-card-icon">
                <Truck size={18} />
              </div>
              <div className="supplier-card-body">
                <h3 className="supplier-name">{supplier.name}</h3>
                {supplier.phone && (
                  <p className="supplier-phone">
                    <Phone size={12} />
                    {supplier.phone}
                  </p>
                )}
                <span className="supplier-products-pill">
                  <Package2 size={11} />
                  {supplier.products_count} linked product{supplier.products_count === 1 ? '' : 's'}
                </span>
              </div>
              <motion.button
                className="supplier-delete"
                onClick={() => requestDelete(supplier)}
                disabled={supplier.products_count > 0}
                whileHover={supplier.products_count > 0 ? {} : { scale: 1.08 }}
                whileTap={supplier.products_count > 0 ? {} : { scale: 0.92 }}
                title={supplier.products_count > 0 ? 'Cannot remove a supplier with linked products' : 'Remove supplier'}
              >
                <Trash2 size={14} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Add supplier ─────────────────────────────────── */}
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
              className="supplier-form"
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleSubmit}
            >
              <div className="form-header">
                <div className="form-header-icon"><Truck size={16} /></div>
                <div className="form-header-text">
                  <h3>Add supplier</h3>
                  <p>A vendor you can order stock from</p>
                </div>
                <button type="button" className="form-close" onClick={() => setShowForm(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="form-body">
                <div className="field-group">
                  <label className="form-label">Supplier name</label>
                  <div className="input-with-icon">
                    <Building2 size={14} />
                    <input
                      className="form-input"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. Nile Trading Co."
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="form-label">Phone <span className="form-label-optional">(optional)</span></label>
                  <div className="input-with-icon">
                    <Phone size={14} />
                    <input
                      className="form-input"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="e.g. 01012345678"
                    />
                  </div>
                </div>

                {error && (
                  <p className="form-error">
                    <AlertCircle size={14} /> {error}
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary form-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={15} className="spin-icon" /> Saving…
                  </>
                ) : (
                  <>
                    <Check size={15} /> Add supplier
                  </>
                )}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Remove supplier confirmation ─────────────────── */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setPendingDelete(null)}
          >
            <motion.div
              className="confirm-card"
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="confirm-icon">
                <UserRound size={20} />
              </div>
              <h3>Remove {pendingDelete.name}?</h3>
              <p>This vendor will no longer appear when recording new purchases. This can't be undone.</p>

              {deleteError && (
                <p className="form-error">
                  <AlertCircle size={14} /> {deleteError}
                </p>
              )}

              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  className="btn-danger"
                  onClick={confirmDelete}
                  disabled={deleting}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="spin-icon" /> Removing…
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Remove supplier
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}