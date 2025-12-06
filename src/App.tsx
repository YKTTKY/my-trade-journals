import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Trades from './pages/Trades'
import AddTrade from './pages/AddTrade'
import EditTrade from './pages/EditTrade'
import Analytics from './pages/Analytics'
import CalendarView from './pages/CalendarView'
import Templates from './pages/Templates'
import ProtectedRoute from './components/ProtectedRoute'

const App: React.FC = () => {
  const { user } = (useAuth() as any) || {}

  return (
    <Routes>
      {/* Public routes - redirect to dashboard if logged in */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trades" element={<Trades />} />
        <Route path="trades/add" element={<AddTrade />} />
        <Route path="trades/edit/:id" element={<EditTrade />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="templates" element={<Templates />} />
      </Route>
    </Routes>
  )
}

export default App
