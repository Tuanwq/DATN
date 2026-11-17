import { Slot } from 'expo-router'
import { AppShell } from '@/components/native/app-shell'
import { FinanceProvider } from '@/hooks/use-finance'
import { mockFinanceRepository } from '@/services/mock-finance'

export default function InternalLayout() {
  return (
    <FinanceProvider repository={mockFinanceRepository}>
      <AppShell><Slot /></AppShell>
    </FinanceProvider>
  )
}
