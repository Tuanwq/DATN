import AsyncStorage from '@react-native-async-storage/async-storage'
import { vars } from 'nativewind'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useHydrated } from '@/hooks/use-hydrated'
import palette from '@/theme/palette.json'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'so-tien-theme'
const themeStyles = {
  light: vars(Object.fromEntries(Object.entries(palette.light).map(([name, value]) => [`--${name}`, value]))),
  dark: vars(Object.fromEntries(Object.entries(palette.dark).map(([name, value]) => [`--${name}`, value]))),
}
const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  colors: typeof palette.light
  themeStyle: typeof themeStyles.light
  setTheme: (value: Theme) => void
} | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setPreference] = useState<Theme>('system')
  const hasChanged = useRef(false)
  const systemTheme = useColorScheme()
  const hydrated = useHydrated()
  const resolvedTheme = theme === 'system' ? (hydrated && systemTheme === 'dark' ? 'dark' : 'light') : theme

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (active && !hasChanged.current && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setPreference(saved)
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  function setTheme(value: Theme) {
    hasChanged.current = true
    setPreference(value)
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      colors: palette[resolvedTheme],
      themeStyle: themeStyles[resolvedTheme],
      setTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('ThemeProvider is required')
  return context
}
