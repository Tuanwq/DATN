import '../../global.css'
import { Slot } from 'expo-router'
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context'
import { AppShell } from '@/components/native/app-shell'
import { ThemeProvider } from '@/hooks/use-appearance'
import { FinanceProvider } from '@/hooks/use-finance'
import { mockFinanceRepository } from '@/services/mock-finance'

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <FinanceProvider repository={mockFinanceRepository}>
          <AppShell><Slot /></AppShell>
        </FinanceProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
