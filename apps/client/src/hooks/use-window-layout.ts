import { Platform, useWindowDimensions } from 'react-native'
import { useHydrated } from '@/hooks/use-hydrated'

export function useWindowLayout() {
  const { width } = useWindowDimensions()
  const hydrated = useHydrated()
  const desktop = hydrated && Platform.OS === 'web' && width >= 1080
  return {
    desktop,
    wide: hydrated && width >= 720,
    table: hydrated && Platform.OS === 'web' && width >= 1120,
  }
}
