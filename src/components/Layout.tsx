import React, { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

type NavItem = {
  name: string
  href: string
  icon: string
}

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const { logout } = (useAuth() as any) || {}
  const { theme, toggleTheme } = (useTheme() as any) || {}
  const location = useLocation()
  const navigate = useNavigate()

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Trades', href: '/trades', icon: '📈' },
    { name: 'Add Trade', href: '/trades/add', icon: '➕' },
    { name: 'Analytics', href: '/analytics', icon: '📉' },
    { name: 'Calendar', href: '/calendar', icon: '📅' },
    { name: 'Templates', href: '/templates', icon: '📝' },
  ]

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout()
        toast.success('Logged out successfully')
        navigate('/login')
      } catch (error) {
        toast.error('Error logging out')
      }
    }
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-base-100">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-base-200 p-2 rounded-lg border border-base-300"
        >
          ☰
        </button>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-base-200 border-r border-base-300 transition-transform duration-200 ease-in-out`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-base-300">
            <Link to="/dashboard" className="text-xl font-bold text-base-content">
              Trading Journal
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-base-300"
              title={theme === 'abyss' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'abyss' ? '🌙' : '☀️'}
            </button>
          </div>

          <nav className="mt-6 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`nav-link ${
                      isActive(item.href) ? 'active' : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-base-300">
            <button
              onClick={handleLogout}
              className="w-full btn btn-error"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Backdrop for mobile menu */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
