import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './LoadingScreen.css'

const MESSAGES = [
  'Waking up the warehouse…',
  'Counting the stock…',
  'Almost there…',
]

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="loading-screen">
      <div className="loading-glow loading-glow-1" />
      <div className="loading-glow loading-glow-2" />

      <div className="loading-content">
        <div className="loading-rings">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />

          <motion.span
            className="spin-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          <motion.img
            src="/images/stocky-logo.svg"
            alt="Stocky"
            className="loading-logo"
            animate={{ scale: [1, 1.07, 1], rotate: [0, -3, 0, 3, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.p
          className="loading-brand"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          Stocky
        </motion.p>

        <div className="loading-message">
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {MESSAGES[messageIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="loading-bar-track">
          <motion.div
            className="loading-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.4, ease: 'easeInOut' }}
          />
          <motion.div
            className="loading-bar-shine"
            animate={{ x: ['-100%', '220%'] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  )
}