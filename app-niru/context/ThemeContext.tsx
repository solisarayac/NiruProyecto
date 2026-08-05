import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
  const systemTheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    loadTheme()
  }, [])

  async function loadTheme() {
    const saved = await AsyncStorage.getItem('theme_mode')
    if (saved) {
      setMode(saved as ThemeMode)
    } else {
      setMode(systemTheme === 'dark' ? 'dark' : 'light')
    }
  }

  async function toggleTheme() {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
    await AsyncStorage.setItem('theme_mode', newMode)
  }

  const Colors = mode === 'light' ? LightColors : DarkColors

  return (
    <ThemeContext.Provider value={{ Colors, mode, toggleTheme, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}