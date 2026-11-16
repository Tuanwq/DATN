import { ChartNoAxesCombined, Wallet } from 'lucide-react-native'
import { View } from 'react-native'
import { categories, CategoryIcon } from '@/components/native/category'
import { MetricCard } from '@/components/native/finance-cards'
import { FinanceState } from '@/components/native/finance-state'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { formatMonth, formatVnd } from '@/lib/format'
import { summarizeTransactions, transactionsForMonth } from '@/services/finance'
import { AppText, Card, PageHeading, PanelHeading } from '@/ui/primitives'

export default function ForecastPage() {
  const { wide } = useWindowLayout()
  return (
    <FinanceState>{({ forecast, transactions, latestMonth }) => {
      const totalVnd = forecast.items.reduce((total, item) => total + item.estimateVnd, 0)
      const previousVnd = summarizeTransactions(transactionsForMonth(transactions, latestMonth)).expense
      return (
        <>
          <PageHeading title="Dự báo" description={`Chi tiêu dự kiến cho ${formatMonth(forecast.month).toLocaleLowerCase('vi')} từ dữ liệu minh họa.`} />
          <View className={`gap-3 ${wide ? 'flex-row' : ''}`}>
            <MetricCard label="Chi tiêu dự kiến" amountVnd={totalVnd} icon={ChartNoAxesCombined} />
            <MetricCard label="Chi tiêu tháng trước" amountVnd={previousVnd} icon={Wallet} tone="blue" />
          </View>
          <Card className="gap-4 p-4 sm:p-5">
            <PanelHeading title="Dự báo theo danh mục" description="Số tiền dự kiến trong kỳ" />
            <View className={`gap-3 ${wide ? 'flex-row flex-wrap' : ''}`}>
              {forecast.items.map(({ categoryId, estimateVnd }) => (
                <View key={categoryId} className={`flex-row items-center gap-2 rounded-lg border border-border p-3 ${wide ? 'w-[48%]' : ''}`}>
                  <CategoryIcon id={categoryId} />
                  <AppText className="min-w-0 flex-1 font-semibold">{categories[categoryId].label}</AppText>
                  <AppText className="font-bold">{formatVnd(estimateVnd)}</AppText>
                </View>
              ))}
            </View>
          </Card>
        </>
      )
    }}</FinanceState>
  )
}
