import { View } from 'react-native'
import { formatMonth, formatVnd, shortMonth } from '@/lib/format'
import type { MonthKey } from '@/types/finance'
import { Card, MutedText, PanelHeading } from '@/ui/primitives'

interface CashFlowPoint {
  month: MonthKey
  income: number
  expense: number
}

const CHART_HEIGHT = 168

export function CashFlowChart({ points }: { points: CashFlowPoint[] }) {
  const largestVnd = Math.max(0, ...points.flatMap(({ income, expense }) => [income, expense]))
  const step = Math.max(5, Math.ceil(largestVnd / 15_000_000) * 5)
  const ceilingVnd = step * 3 * 1_000_000
  const summary = points.map(({ month, income, expense }) => (
    `${formatMonth(month)}, thu ${formatVnd(income)}, chi ${formatVnd(expense)}`
  )).join('. ')

  return (
    <Card className="min-w-0 flex-1 gap-4 p-4 sm:p-5">
      <PanelHeading title="Dòng tiền" description="Thu nhập và chi tiêu theo tháng" />
      <View className="flex-row flex-wrap items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full bg-chart-income" />
          <MutedText className="text-xs">Thu nhập</MutedText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full bg-chart-expense" />
          <MutedText className="text-xs">Chi tiêu</MutedText>
        </View>
      </View>
      <View accessible accessibilityRole="image" accessibilityLabel={summary}>
        <View className="relative pt-2" aria-hidden>
          {[step * 3, step * 2, step, 0].map((value, index) => (
            <View key={value} className="absolute inset-x-0 flex-row items-center gap-1" style={{ top: index * CHART_HEIGHT / 3 }}>
              <MutedText className="w-10 text-xs">{value ? `${value} tr` : '0'}</MutedText>
              <View className="flex-1 border-t border-border" />
            </View>
          ))}
          <View className="ml-11 flex-row">
            {points.map(({ month, income, expense }) => (
              <View key={month} className="min-w-0 flex-1 items-center gap-2">
                <View className="w-full flex-row items-end justify-center gap-1" style={{ height: CHART_HEIGHT }}>
                  <View className="w-1/4 max-w-7 rounded-t bg-chart-income" style={{ height: income / ceilingVnd * CHART_HEIGHT }} />
                  <View className="w-1/4 max-w-7 rounded-t bg-chart-expense" style={{ height: expense / ceilingVnd * CHART_HEIGHT }} />
                </View>
                <MutedText className="text-xs">{shortMonth(month)}</MutedText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  )
}
