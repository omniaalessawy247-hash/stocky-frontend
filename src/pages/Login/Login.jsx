import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ShoppingBag, Boxes, ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Login.css'

const ROLES = [
  { id: 'cashier', label: 'Cashier', icon: ShoppingBag, tint: 'teal' },
  { id: 'manager', label: 'Manager', icon: Boxes, tint: 'amber' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, tint: 'violet' },
]

const formVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] = useState('cashier')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const loggedInUser = await login(email, password)

      if (loggedInUser.role !== selectedRole) {
        setError(`This account is registered as ${loggedInUser.role}, not ${selectedRole}`)
        setSubmitting(false)
        return
      }

      setShowLoading(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError('Invalid email or password')
      setSubmitting(false)
    }
  }

  if (showLoading) return <LoadingScreen />

  return (
    <div className="login-page">
      {/* Animated colorful background: drifting crates + soft light blobs */}
      <div className="login-bg" aria-hidden="true">
        <span className="bg-blob bg-blob-teal" />
        <span className="bg-blob bg-blob-amber" />
        <span className="bg-blob bg-blob-violet" />
        <span className="bg-crate bg-crate-1" />
        <span className="bg-crate bg-crate-2" />
        <span className="bg-crate bg-crate-3" />
        <span className="bg-crate bg-crate-4" />
        <span className="bg-grid" />
      </div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="login-logo-wrap"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 15, delay: 0.1 }}
        >
          <img src="/images/stocky-logo.svg" alt="Stocky" className="login-logo" />
        </motion.div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Select your role and sign in to continue</p>

        <div className="role-selector">
          {ROLES.map((role) => {
            const Icon = role.icon
            const isActive = selectedRole === role.id
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => { setSelectedRole(role.id); setError('') }}
                className={`role-chip role-chip-${role.tint} ${isActive ? 'role-chip-active' : ''}`}
              >
                <motion.span
                  className="role-chip-icon"
                  animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <Icon size={16} />
                </motion.span>
                <span>{role.label}</span>
              </button>
            )
          })}
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="login-form"
          variants={formVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div className="input-group" variants={fieldVariants}>
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </motion.div>

          <motion.div className="input-group" variants={fieldVariants}>
            <Lock size={16} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={showPassword ? 'hide' : 'show'}
                  initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="login-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className={`login-submit ${submitting ? 'login-submit-busy' : ''}`}
            disabled={submitting}
            variants={fieldVariants}
            whileHover={!submitting ? { scale: 1.015 } : {}}
            whileTap={!submitting ? { scale: 0.98 } : {}}
          >
            <AnimatePresence mode="wait" initial={false}>
              {submitting ? (
                <motion.span
                  key="spinner"
                  className="login-spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              ) : (
                <motion.span
                  key="label"
                  className="login-submit-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Sign in
                  <ArrowRight size={16} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}