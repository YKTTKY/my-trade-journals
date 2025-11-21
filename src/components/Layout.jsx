import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
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

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-dark-card p-2 rounded-lg border border-dark-border"
        >
          ☰
        </button>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-card border-r border-dark-border transition-transform duration-200 ease-in-out`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-border">
            <Link to="/dashboard" className="text-xl font-bold text-white">
              Trading Journal
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-dark-bg"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
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

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border">
            <button
              onClick={handleLogout}
              className="w-full btn-danger"
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
