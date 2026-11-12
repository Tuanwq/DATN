import { View } from 'react-native'
import { CashFlowChart } from '@/components/native/cash-flow-chart'
import { categories, CategoryIcon } from '@/components/native/category'
import { FinanceState, PeriodSelect } from '@/components/native/finance-state'
import { useReportMonth } from '@/hooks/use-report-period'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { formatPercent, formatVnd } from '@/lib/format'
import { expenseByCategory, getCashFlow, transactionsForMonth } from '@/services/finance'
import type { FinanceSnapshot } from '@/types/finance'
import { AppText, Card, MutedText, PageHeading, PanelHeading } from '@/ui/primitives'

function Statistics({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [month, setMonth] = useReportMonth(snapshot)
  const { desktop } = useWindowLayout()
  const expenses = [...expenseByCategory(transactionsForMonth(snapshot.transactions, month))]
    .sort(([, first], [, second]) => second - first)
  const totalVnd = expenses.reduce((total, [, amount]) => total + amount, 0)

  return (
    <>
      <PageHeading title="Thống kê" description="So sánh dòng tiền và xem chi tiêu tập trung ở đâu.">
        <PeriodSelect value={month} months={snapshot.months} onChange={setMonth} />
      </PageHeading>
      <View className={`gap-3 ${desktop ? 'flex-row items-start' : ''}`}>
        <CashFlowChart points={getCashFlow(snapshot, month)} />
        <Card className="min-w-0 flex-1 gap-4 p-4 sm:p-5">
          <PanelHeading title="Cơ cấu chi tiêu" description={`Tổng chi ${formatVnd(totalVnd)}`} />
          {expenses.map(([categoryId, amountVnd]) => (
            <View key={categoryId} className="flex-row items-center gap-2 border-t border-border pt-3">
              <CategoryIcon id={categoryId} />
              <AppText className="min-w-0 flex-1 font-semibold">{categories[categoryId].label}</AppText>
              <View className="items-end">
                <AppText className="font-bold">{formatVnd(amountVnd)}</AppText>
                <MutedText className="text-xs">{formatPercent(amountVnd / totalVnd)}</MutedText>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </>
  )
}

export default function StatisticsPage() {
  return <FinanceState>{(snapshot) => <Statistics snapshot={snapshot} />}</FinanceState>
}
