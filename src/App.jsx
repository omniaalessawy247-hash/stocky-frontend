import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login/Login'
import Products from './pages/Manager/products/Products'
import Sales from './pages/Manager/sales/sales'
import Users from './pages/Users'
import Overview from './pages/Manager/Overview/Overview'
import Purchases from './pages/Manager/Purchases/Purchases'
import Suppliers from './pages/Manager/Suppliers/Suppliers'
import POS from './pages/Cashier/POS/POS'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import { useAuth } from './context/AuthContext'

function RoleDashboard() {
  const { role } = useAuth()
  if (role === 'manager' || role === 'admin') return <Overview />
  return <POS />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<RoleDashboard />} />
                <Route
                  path="/products"
                  element={
                    <RoleRoute allow={['admin', 'manager']}>
                      <Products />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/purchases"
                  element={
                    <RoleRoute allow={['admin', 'manager']}>
                      <Purchases />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <RoleRoute allow={['admin', 'manager']}>
                      <Suppliers />
                    </RoleRoute>
                  }
                />
                <Route path="/sales" element={<Sales />} />
                <Route
                  path="/users"
                  element={
                    <RoleRoute allow={['admin']}>
                      <Users />
                    </RoleRoute>
                  }
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}