import React, { createContext, useContext, useState, useEffect } from 'react'

type ThemeContextValue = {
  theme: string
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Fallback for incremental migration
    return { theme: 'dark', toggleTheme: () => {}, isDark: true }
  }
  return ctx
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    return saved || 'dark'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
