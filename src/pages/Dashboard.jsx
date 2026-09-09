import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Sparkles, TrendingUp, AlertTriangle, Package, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { role, user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/dashboard/summary?lang=${i18n.language}`)
      if (res.data.status === 'processing') {
        setTimeout(fetchSummary, 3000)
      } else {
        setData(res.data)
        setLoading(false)
      }
    } catch (e) {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchSummary()
  }, [i18n.language])

  const chartData = [
    { name: t('dashboard.yesterday_sales'), value: data?.yesterday_sales || 0 },
    { name: t('dashboard.today_sales'), value: data?.today_sales || 0 },
  ]
  const lowStockCount = data?.low_stock_count || 0
  const pieData = [
    { name: 'ok', value: Math.max(0, 6 - lowStockCount) },
    { name: 'low', value: lowStockCount },
  ]

  const welcomeKey = role === 'admin' ? 'welcome_admin' : role === 'manager' ? 'welcome_manager' : 'welcome_cashier'

  // Cashier gets a simplified, action-focused view
  if (role === 'cashier') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {t('dashboard.welcome_cashier')}, {user?.name?.split(' ')[0]} 👋
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title={t('dashboard.today_sales')} value={data?.today_sales || 0} prefix="$" color="linear-gradient(135deg,#2563eb,#0ea5e9)" delay={0} />
          <StatCard title={t('dashboard.orders')} value={data?.today_orders || 0} color="linear-gradient(135deg,#f59e0b,#fcd34d)" delay={0.1} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link to="/sales">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl p-8 flex items-center justify-between cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
            >
              <div>
                <h3 className="text-white text-lg font-semibold">{t('sales.new_sale')}</h3>
                <p className="text-white/80 text-sm mt-1">{t('dashboard.welcome_cashier')}</p>
              </div>
              <ShoppingCart size={40} className="text-white/90" />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {t('nav.dashboard')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{t(`dashboard.${welcomeKey}`)}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.today_sales')} value={data?.today_sales || 0} prefix="$" color="linear-gradient(135deg,#2563eb,#0ea5e9)" delay={0} />
        <StatCard title={t('dashboard.orders')} value={data?.today_orders || 0} color="linear-gradient(135deg,#0ea5e9,#67e8f9)" delay={0.1} />
        <StatCard title={t('dashboard.low_stock')} value={data?.low_stock_count || 0} color="linear-gradient(135deg,#f59e0b,#fcd34d)" delay={0.2} />
        <StatCard title={t('dashboard.top_product')} value={data?.top_product?.total_qty || 0} color="linear-gradient(135deg,#e11d48,#fb7185)" delay={0.3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-white" />
          <h3 className="text-white font-semibold">{t('dashboard.ai_insight')}</h3>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">
          {loading ? t('dashboard.generating') : data?.ai_summary}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
              {t('dashboard.today_sales')} vs {t('dashboard.yesterday_sales')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{t('dashboard.low_stock')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>
                {pieData.map((entry, i) => (<Cell key={i} fill={i === 0 ? '#16a34a' : '#f59e0b'} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {data?.low_stock_products?.length > 0 && (
            <div className="mt-2 space-y-1">
              {data.low_stock_products.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <AlertTriangle size={12} className="text-amber-500" />
                  {p.name} ({p.quantity})
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}