import { createContext, useContext, useState, ReactNode } from 'react'
import { LightColors, DarkColors } from '../constants/theme'

type ThemeMode = 'light' | 'dark'

type ThemeContextType = {
  Colors: typeof LightColors
  mode: ThemeMode
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  Colors: LightColors,
  mode: 'light',
  toggleTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const Colors = mode === 'light' ? LightColors : DarkColors

  function toggleTheme() {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ Colors, mode, toggleTheme, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}