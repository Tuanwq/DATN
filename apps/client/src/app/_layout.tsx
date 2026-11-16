import '../../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ActivityIndicator, AppState, View } from 'react-native'
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from '@/hooks/use-appearance'
import { useAuth } from '@/hooks/use-auth'
import { AppText, Button } from '@/ui/primitives'

function SessionLayout() {
  const { colors, resolvedTheme, themeStyle } = useTheme()
  const current = useAuth((state) => state.current)
  const restore = useAuth((state) => state.restore)
  const expire = useAuth((state) => state.expire)

  useEffect(() => {
    void restore()
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void restore()
    })
    return () => listener.remove()
  }, [restore])

  useEffect(() => {
    if (current.status !== 'signed-in') return
    const { session } = current
    const timer = setTimeout(() => expire(session), Math.max(0, Date.parse(session.expiresAt) - Date.now()))
    return () => clearTimeout(timer)
  }, [current, expire])

  return (
    <View className="flex-1 bg-background" style={themeStyle}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      {current.status === 'checking' || current.status === 'unavailable' ? (
        <View className="flex-1 items-center justify-center gap-3 p-6">
          {current.status === 'checking' ? (
            <>
              <ActivityIndicator color={colors.foreground} />
              <AppText accessibilityLiveRegion="polite">Đang kiểm tra phiên đăng nhập…</AppText>
            </>
          ) : (
            <>
              <AppText accessibilityRole="alert" className="text-center">{current.error}</AppText>
              <Button label="Thử lại" onPress={() => void restore()} />
            </>
          )}
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Protected guard={current.status === 'signed-out'}>
            <Stack.Screen name="dang-nhap" />
          </Stack.Protected>
          <Stack.Protected guard={current.status === 'signed-in'}>
            <Stack.Screen name="(internal)" />
          </Stack.Protected>
        </Stack>
      )}
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <SessionLayout />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
