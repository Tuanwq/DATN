import { View } from 'react-native'
import { ArrowDownLeft, ArrowUpRight, Wallet, type LucideIcon } from 'lucide-react-native'
import { useTheme } from '@/hooks/use-appearance'
import { formatPercent, formatVnd, shortMonth } from '@/lib/format'
import type { MonthKey } from '@/types/finance'
import { AppText, Card, IconTile, MutedText, type Tone } from '@/ui/primitives'

export function BalanceCard({ balanceVnd, accountCount, asOfMonth }: {
  balanceVnd: number
  accountCount: number
  asOfMonth: MonthKey
}) {
  return (
    <View className="min-h-40 flex-1 justify-between gap-3 overflow-hidden rounded-xl bg-[#14392d] p-5">
      <View className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#3a6957]" aria-hidden />
      <View className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#3a6957]" aria-hidden />
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#255743]" aria-hidden>
          <Wallet size={18} color="#a1ffcb" />
        </View>
        <AppText tone="white" className="font-semibold">Tổng số dư</AppText>
      </View>
      <AppText tone="white" className="text-3xl font-extrabold tracking-tight">{formatVnd(balanceVnd)}</AppText>
      <AppText tone="balanceDetail">{accountCount} tài khoản · Cuối {shortMonth(asOfMonth)}/{asOfMonth.split('-')[0]}</AppText>
    </View>
  )
}

export function MetricCard({ label, amountVnd, icon, tone = 'green', change, favorable }: {
  label: string
  amountVnd: number
  icon: LucideIcon
  tone?: Tone
  change?: number | null
  favorable?: boolean
}) {
  const { colors } = useTheme()
  const ChangeIcon = (change ?? 0) >= 0 ? ArrowUpRight : ArrowDownLeft

  return (
    <Card className="min-w-0 flex-1 justify-between gap-3 p-5">
      <View className="flex-row items-center gap-2">
        <IconTile icon={icon} tone={tone} />
        <MutedText className="shrink font-semibold">{label}</MutedText>
      </View>
      <AppText className="text-2xl font-extrabold tracking-tight">{formatVnd(amountVnd)}</AppText>
      {change != null && (
        <View className="flex-row flex-wrap items-center gap-1.5">
          <ChangeIcon size={15} color={favorable ? colors.positive : colors.warning} aria-hidden />
          <AppText tone={favorable ? 'positive' : 'warning'} className="font-bold">{formatPercent(Math.abs(change))}</AppText>
          <MutedText>so với tháng trước</MutedText>
        </View>
      )}
    </Card>
  )
}
