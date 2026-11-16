import type { ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { CalendarDays } from 'lucide-react-native'
import { useTheme } from '@/hooks/use-appearance'
import { useFinance } from '@/hooks/use-finance'
import { formatMonth } from '@/lib/format'
import type { FinanceSnapshot, MonthKey } from '@/types/finance'
import { AppText, Button, Card, MutedText } from '@/ui/primitives'
import { Select } from '@/ui/select'

export function FinanceState({ children }: { children: (snapshot: FinanceSnapshot) => ReactNode }) {
  const state = useFinance()
  const { colors } = useTheme()
  if (state.status === 'ready') return children(state.snapshot)

  if (state.status === 'loading') {
    return (
      <View className="flex-row items-center gap-3 py-5" accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <MutedText>Đang tải dữ liệu tài chính…</MutedText>
      </View>
    )
  }

  return (
    <Card className="items-start gap-3 p-5">
      <AppText role="alert">Không tải được dữ liệu tài chính.</AppText>
      <Button label="Thử lại" onPress={state.retry} />
    </Card>
  )
}

export function PeriodSelect({ value, months, onChange }: { value: MonthKey; months: MonthKey[]; onChange: (month: MonthKey) => void }) {
  const options = [...months].reverse().map((month) => ({ value: month, label: formatMonth(month) }))
  return <Select label="Kỳ báo cáo" value={value} options={options} onChange={onChange} icon={CalendarDays} />
}
