import { Coins, Target, Wallet } from 'lucide-react-native'
import { View } from 'react-native'
import { BudgetProgress } from '@/components/native/budget-progress'
import { MetricCard } from '@/components/native/finance-cards'
import { FinanceState, PeriodSelect } from '@/components/native/finance-state'
import { useReportMonth } from '@/hooks/use-report-period'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { getBudgetUsage } from '@/services/finance'
import type { FinanceSnapshot } from '@/types/finance'
import { Card, PageHeading, PanelHeading } from '@/ui/primitives'

function Budgets({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [month, setMonth] = useReportMonth(snapshot)
  const { wide } = useWindowLayout()
  const budgets = getBudgetUsage(snapshot, month)
  const limitVnd = budgets.reduce((total, budget) => total + budget.limitVnd, 0)
  const spentVnd = budgets.reduce((total, budget) => total + budget.spentVnd, 0)
  const overBudget = spentVnd > limitVnd

  return (
    <>
      <PageHeading title="Ngân sách" description="Đối chiếu chi tiêu với hạn mức của từng danh mục.">
        <PeriodSelect value={month} months={snapshot.months} onChange={setMonth} />
      </PageHeading>
      <View className={`gap-3 ${wide ? 'flex-row' : ''}`}>
        <MetricCard label="Tổng hạn mức" amountVnd={limitVnd} icon={Target} />
        <MetricCard label="Đã chi trong danh mục" amountVnd={spentVnd} icon={Coins} tone="amber" />
        <MetricCard label={overBudget ? 'Vượt hạn mức' : 'Còn lại'} amountVnd={Math.abs(limitVnd - spentVnd)} icon={Wallet} tone={overBudget ? 'rose' : 'blue'} />
      </View>
      <Card className="gap-5 p-4 sm:p-5">
        <PanelHeading title="Hạn mức theo danh mục" description="Số tiền đã chi trong kỳ đã chọn" />
        <View className={`gap-4 ${wide ? 'flex-row flex-wrap' : ''}`}>
          {budgets.map((budget) => (
            <View key={budget.categoryId} className={`rounded-lg border border-border p-3 ${wide ? 'w-[48%]' : ''}`}>
              <BudgetProgress {...budget} detailed />
            </View>
          ))}
        </View>
      </Card>
    </>
  )
}

export default function BudgetsPage() {
  return <FinanceState>{(snapshot) => <Budgets snapshot={snapshot} />}</FinanceState>
}
