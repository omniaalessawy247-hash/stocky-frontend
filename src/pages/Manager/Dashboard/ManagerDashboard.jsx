import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Truck, DollarSign, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../../api/client'
import { useAuth } from '../../../context/AuthContext'
import './ManagerDashboard.css'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [aiSummary, setAiSummary] = useState('')
  const [loadingAi, setLoadingAi] = useState(true)

  const fetchSummary = async () => {
    try {
      const response = await api.get('/dashboard/summary?lang=en')
      if (response.data.status === 'processing') {
        setTimeout(fetchSummary, 3000)
      } else {
        setAiSummary(response.data.ai_summary)
        setLoadingAi(false)
      }
    } catch (error) {
      setLoadingAi(false)
    }
  }

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data.data || res.data))
    api.get('/suppliers').then((res) => setSuppliers(res.data))
    fetchSummary()
  }, [])

  const lowStockProducts = products.filter((p) => p.stock_status === 'low')
  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0)

  return (
    <div className="manager-dashboard">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Here's your inventory overview for today</p>
      </motion.div>

      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 14%, transparent)', color: 'var(--color-primary)' }}>
            <Package size={18} />
          </div>
          <div>
            <p className="stat-value">{products.length}</p>
            <p className="stat-label">Total Products</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 16%, transparent)', color: 'var(--color-accent)' }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="stat-value">{lowStockProducts.length}</p>
            <p className="stat-label">Low Stock Items</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 14%, transparent)', color: 'var(--color-secondary)' }}>
            <Truck size={18} />
          </div>
          <div>
            <p className="stat-value">{suppliers.length}</p>
            <p className="stat-label">Active Suppliers</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 14%, transparent)', color: 'var(--color-success)' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <p className="stat-value">${totalStockValue.toFixed(0)}</p>
            <p className="stat-label">Stock Value</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="ai-insight-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="ai-insight-header">
          <Sparkles size={16} />
          <span>Inventory Insight</span>
        </div>
        <p className="ai-insight-text">{loadingAi ? 'Analyzing your inventory...' : aiSummary}</p>
      </motion.div>

      <motion.div
        className="low-stock-panel"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
      >
        <div className="panel-header">
          <h3>Needs Restocking</h3>
          <Link to="/products" className="panel-link">
            Manage products
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <p className="panel-empty">Everything is well stocked right now</p>
        ) : (
          <div className="low-stock-list">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="low-stock-row">
                <span className="low-stock-name">{product.name}</span>
                <span className="low-stock-qty">{product.quantity} left</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}