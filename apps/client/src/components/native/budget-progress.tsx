import { View } from 'react-native'
import { categories, CategoryIcon } from '@/components/native/category'
import { formatPercent, formatVnd } from '@/lib/format'
import type { Budget } from '@/types/finance'
import { AppText, MutedText } from '@/ui/primitives'

export function BudgetProgress({ categoryId, limitVnd, spentVnd, detailed = false }: Budget & { spentVnd: number; detailed?: boolean }) {
  const usage = spentVnd / limitVnd
  const progress = Math.min(100, Math.round(usage * 100))
  const label = categories[categoryId].label
  const trackColor = usage >= 1 ? 'bg-danger' : usage >= 0.8 ? 'bg-warning' : 'bg-chart-income'

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <CategoryIcon id={categoryId} />
        <AppText className="flex-1 font-semibold">{label}</AppText>
        <MutedText className="font-semibold">{formatPercent(usage)}</MutedText>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Ngân sách ${label}`}
        accessibilityValue={{ min: 0, max: 100, now: progress, text: formatPercent(usage) }}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <View className={`h-full rounded-full ${trackColor}`} style={{ width: `${progress}%` }} />
      </View>
      {detailed && <MutedText><AppText className="font-semibold">{formatVnd(spentVnd)}</AppText> / {formatVnd(limitVnd)}</MutedText>}
    </View>
  )
}
