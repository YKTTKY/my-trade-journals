import React, { createContext, useContext, useState, useEffect } from 'react'

type ThemeContextValue = {
  theme: 'abyss' | 'lemonade'
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Fallback for incremental migration
    return { theme: 'abyss' as const, toggleTheme: () => {}, isDark: true }
  }
  return ctx
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'abyss' | 'lemonade'>(() => {
    if (typeof window === 'undefined') return 'abyss'
    
    const saved = localStorage.getItem('theme') as 'abyss' | 'lemonade' | null
    if (saved) return saved
    
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'abyss' : 'lemonade'
  })

  useEffect(() => {
    // Set the data-theme attribute for daisyUI on both html and document.documentElement
    const htmlElement = document.documentElement
    htmlElement.setAttribute('data-theme', theme)
    // Also ensure theme context value is logged for debugging
    console.log('Theme set to:', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'abyss' ? 'lemonade' : 'abyss'))

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    isDark: theme === 'abyss',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
