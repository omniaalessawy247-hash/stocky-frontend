import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)

  const login = async (email, password) => {
    const response = await api.post('/login', { email, password })
    const role = response.data.user.roles?.[0] || 'cashier'
    const userData = { ...response.data.user, role }

    setUser(userData)
    setToken(response.data.token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', response.data.token)

    return userData
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      // Token might already be invalid, proceed with local cleanup anyway
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, role: user?.role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)