import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, X, Shield, UserCog, ShoppingBag, Users2, Mail, Lock, ChevronDown, Loader2,
} from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Users.css'

const roleMeta = {
  admin: { label: 'Admin', icon: Shield, accent: '#e11d48' },
  manager: { label: 'Manager', icon: UserCog, accent: '#4338ca' },
  cashier: { label: 'Cashier', icon: ShoppingBag, accent: '#059669' },
}

const emptyForm = { name: '', email: '', password: '', role: 'cashier' }

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    const response = await api.get('/users')
    setUsers(response.data)
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const openAddForm = () => {
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/users', form)
      setShowForm(false)
      await loadUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member from Stocky?')) return
    await api.delete(`/users/${id}`)
    await loadUsers()
  }

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {})

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <span className="page-eyebrow">Workspace</span>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage who has access to Stocky and their role</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddForm}>
          <Plus size={16} /> Add member
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-indigo">
          <span className="stat-card-icon"><Users2 size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">{users.length}</span>
            <span className="stat-card-label">Team members</span>
          </div>
        </div>

        <div className="stat-card stat-card-rose">
          <span className="stat-card-icon"><Shield size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">{roleCounts.admin || 0}</span>
            <span className="stat-card-label">Admins</span>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <span className="stat-card-icon"><UserCog size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">{roleCounts.manager || 0}</span>
            <span className="stat-card-label">Managers</span>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <span className="stat-card-icon"><ShoppingBag size={18} /></span>
          <div className="stat-card-text">
            <span className="stat-card-value">{roleCounts.cashier || 0}</span>
            <span className="stat-card-label">Cashiers</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="users-loading">
          <Loader2 size={22} className="spin" />
          <p>Loading team members…</p>
        </div>
      ) : (
        <div className="users-grid">
          {users.map((teamMember, index) => {
            const meta = roleMeta[teamMember.role] || roleMeta.cashier
            const Icon = meta.icon
            const isYou = teamMember.id === currentUser?.id
            return (
              <motion.div
                key={teamMember.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="user-card"
                style={{ '--role-accent': meta.accent }}
              >
                <div className="user-card-top">
                  <div className="user-card-avatar">
                    <Icon size={18} />
                  </div>
                  {isYou && <span className="you-badge">You</span>}
                </div>

                <p className="user-card-name">{teamMember.name}</p>
                <p className="user-card-email">
                  <Mail size={12} /> {teamMember.email}
                </p>

                <div className="user-card-footer">
                  <span className="role-pill">
                    <Icon size={12} /> {meta.label}
                  </span>
                  {!isYou && (
                    <button
                      type="button"
                      className="user-delete"
                      onClick={() => handleDelete(teamMember.id)}
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

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
              initial={{ scale: 0.93, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleSubmit}
            >
              <div className="modal-header">
                <div className="modal-header-icon">
                  <Users2 size={18} />
                </div>
                <div className="modal-header-text">
                  <h3>Add team member</h3>
                  <p>They'll be able to sign in with the role you choose</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setShowForm(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Full name</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Sarah Ahmed"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Email address</label>
                  <div className="input-icon-wrap">
                    <Mail size={14} className="input-icon" />
                    <input
                      required
                      type="email"
                      className="form-input form-input-icon"
                      placeholder="name@stocky.com"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={14} className="input-icon" />
                    <input
                      required
                      type="password"
                      className="form-input form-input-icon"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Role</label>
                  <div className="role-select-grid">
                    {Object.entries(roleMeta).map(([key, meta]) => {
                      const Icon = meta.icon
                      const active = form.role === key
                      return (
                        <button
                          type="button"
                          key={key}
                          className={`role-select-chip ${active ? 'role-select-chip-active' : ''}`}
                          style={{ '--role-accent': meta.accent }}
                          onClick={() => setForm({ ...form, role: key })}
                        >
                          <Icon size={15} />
                          <span>{meta.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && <p className="form-error">{error}</p>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (<><Loader2 size={15} className="spin" /> Adding…</>) : 'Add member'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}