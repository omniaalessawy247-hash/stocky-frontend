import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ allow, children }) {
  const { role } = useAuth()
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return children
}