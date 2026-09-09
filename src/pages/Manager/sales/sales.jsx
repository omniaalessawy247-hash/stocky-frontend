import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, DollarSign, TrendingUp, UserRound, Calendar, ShoppingBag } from 'lucide-react'
import api from '../../../api/client'
import { useAuth } from '../../../context/AuthContext'  
import './sales.css'

const ACCENTS = ['accent-indigo', 'accent-emerald', 'accent-cyan', 'accent-amber', 'accent-rose']

export default function Sales() {
  const { role } = useAuth()
  const isManagerOrAdmin = role === 'admin' || role === 'manager'

  const [sales, setSales] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    setLoadingData(true)
    api.get('/sales')
      .then((res) => setSales(res.data.data || res.data))
      .finally(() => setLoadingData(false))
  }, [])

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const averageSale = sales.length ? totalRevenue / sales.length : 0

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div>
          <span className="page-eyebrow">
            <Receipt size={13} /> Transactions
          </span>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">
            {isManagerOrAdmin
              ? 'Every sale recorded at the register, most recent first'
              : 'Your sales, most recent first'}
          </p>
        </div>
      </div>

      {!loadingData && sales.length > 0 && (
        <div className="sales-summary-row">
          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="summary-icon summary-icon-indigo"><ShoppingBag size={16} /></div>
            <div>
              <p className="summary-value">{sales.length}</p>
              <p className="summary-label">{isManagerOrAdmin ? 'Total sales' : 'Your sales'}</p>
            </div>
          </motion.div>

          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="summary-icon summary-icon-emerald"><DollarSign size={16} /></div>
            <div>
              <p className="summary-value">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="summary-label">{isManagerOrAdmin ? 'Total revenue' : 'Your revenue'}</p>
            </div>
          </motion.div>

          <motion.div className="summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="summary-icon summary-icon-cyan"><TrendingUp size={16} /></div>
            <div>
              <p className="summary-value">${averageSale.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="summary-label">Average sale</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="sales-list">
        {loadingData ? (
          <div className="sales-loading">
            <div className="loading-card" />
            <div className="loading-card" />
            <div className="loading-card" />
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Receipt size={26} /></div>
            <p>No sales recorded yet</p>
            <span>
              {isManagerOrAdmin
                ? 'Sales made at the register will show up here as they come in'
                : 'Sales you make at the register will show up here'}
            </span>
          </div>
        ) : (
          sales.map((sale, index) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              className={`sale-card ${ACCENTS[index % ACCENTS.length]}`}
            >
              <div className="sale-card-icon">
                <Receipt size={18} />
              </div>
              <div className="sale-card-body">
                <div className="sale-card-top">
                  <span className="sale-id">Sale #{sale.id}</span>
                  <span className="sale-total">${sale.total}</span>
                </div>
                <div className="sale-meta">
                  {isManagerOrAdmin && (
                    <span className="sale-meta-item">
                      <UserRound size={11} />
                      {sale.cashier}
                    </span>
                  )}
                  <span className="sale-meta-item">
                    <Calendar size={11} />
                    {new Date(sale.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}