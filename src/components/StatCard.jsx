import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

export default function StatCard({ title, value, prefix = '', color, delay = 0 }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v * 100) / 100)

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, delay, ease: 'easeOut' })
    return controls.stop
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)' }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20"
        style={{ background: color }}
      />
      <p className="text-sm relative z-10" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
      <motion.p className="text-2xl font-bold mt-1 relative z-10" style={{ color: 'var(--color-text)' }}>
        {prefix}<motion.span>{rounded}</motion.span>
      </motion.p>
    </motion.div>
  )
}