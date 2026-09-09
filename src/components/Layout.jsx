import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import {
  Moon, Sun, LogOut, LayoutDashboard, Package, Truck, Building2, Receipt, UsersRound,
} from 'lucide-react'
import './Layout.css'

const ICONS = {
  '/': LayoutDashboard,
  '/products': Package,
  '/purchases': Truck,
  '/suppliers': Building2,
  '/sales': Receipt,
  '/users': UsersRound,
}

const ACCENTS = {
  '/': '#4338ca',
  '/products': '#0891b2',
  '/purchases': '#059669',
  '/suppliers': '#b45309',
  '/sales': '#be123c',
  '/users': '#7c3aed',
}

export default function Layout({ children }) {
  const { mode, toggleMode } = useTheme()
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const links = [{ to: '/', label: 'Overview' }]
  if (role === 'admin' || role === 'manager') {
    links.push({ to: '/products', label: 'Products' })
    links.push({ to: '/purchases', label: 'Purchases' })
    links.push({ to: '/suppliers', label: 'Suppliers' })
  }
  links.push({ to: '/sales', label: 'Sales' })
  if (role === 'admin') {
    links.push({ to: '/users', label: 'Team' })
  }

  const initials = (user?.name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const year = new Date().getFullYear()

  return (
    <div className="app-shell">
      <nav className={`app-nav ${scrolled ? 'app-nav-scrolled' : ''}`}>
        <div className="brand">
          <img src="/images/stocky-logo.svg" alt="Stocky" className="brand-logo" />
          <span className="brand-name">Stocky</span>
        </div>

        <div className="nav-links">
          {links.map((link) => {
            const Icon = ICONS[link.to]
            const accent = ACCENTS[link.to]
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                style={{ '--link-accent': accent }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="nav-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="nav-link-content">
                      <Icon size={15} />
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        <div className="nav-toolbar">
          <button type="button" className="icon-btn" onClick={toggleMode} aria-label="Toggle theme">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="icon-swap"
              >
                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <div className="nav-divider" />

          <div className="user-chip">
            <span className="user-avatar">
              {initials}
              <span className="user-status-dot" aria-hidden="true" />
            </span>
            <span className="user-chip-text">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{role}</span>
            </span>
          </div>

          <motion.button
            type="button"
            className="icon-btn icon-btn-danger"
            onClick={handleLogout}
            aria-label="Log out"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </nav>

      <div className="mobile-nav">
        {links.map((link) => {
          const Icon = ICONS[link.to]
          const accent = ACCENTS[link.to]
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
              style={{ '--link-accent': accent }}
            >
              <Icon size={14} />
              {link.label}
            </NavLink>
          )
        })}
      </div>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <div className="footer-main">
          <div className="footer-brand-col">
            <div className="footer-brand-row">
              <img src="/images/stocky-logo.svg" alt="" className="footer-logo" />
              <span className="footer-brand-name">Stocky</span>
            </div>
            <p className="footer-tagline">
              Inventory, purchases and sales, tracked in one place for your whole team.
            </p>
            <div className="footer-status">
              <span className="footer-status-dot" />
              All systems operational
            </div>
          </div>

          <div className="footer-links-col">
            <span className="footer-col-title">Workspace</span>
            <NavLink to="/" className="footer-link">Overview</NavLink>
            <NavLink to="/sales" className="footer-link">Sales</NavLink>
            {(role === 'admin' || role === 'manager') && (
              <NavLink to="/products" className="footer-link">Products</NavLink>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} Stocky. All rights reserved.</span>
          <span className="footer-bottom-meta">Signed in as {user?.name}</span>
        </div>
      </footer>
    </div>
  )
}