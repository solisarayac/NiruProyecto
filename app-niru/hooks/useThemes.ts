import { useState, useCallback } from 'react'
import { LightColors, DarkColors } from '../constants/theme'

type ThemeMode = 'light' | 'dark'

let globalSetTheme: ((mode: ThemeMode) => void) | null = null
let currentMode: ThemeMode = 'light'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(currentMode)

  const toggleTheme = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    currentMode = newMode
    setMode(newMode)
    if (globalSetTheme) globalSetTheme(newMode)
  }, [mode])

  const Colors = mode === 'light' ? LightColors : DarkColors

  return { Colors, mode, toggleTheme, isDark: mode === 'dark' }
}