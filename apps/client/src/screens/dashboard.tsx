import { Link } from 'expo-router'
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from 'lucide-react-native'
import { View } from 'react-native'
import { BudgetProgress } from '@/components/native/budget-progress'
import { CashFlowChart } from '@/components/native/cash-flow-chart'
import { BalanceCard, MetricCard } from '@/components/native/finance-cards'
import { FinanceState, PeriodSelect } from '@/components/native/finance-state'
import { TransactionList } from '@/components/native/transaction-list'
import { useReportMonth } from '@/hooks/use-report-period'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { changePercent, getBudgetUsage, getCashFlow, summarizeTransactions, transactionsForMonth } from '@/services/finance'
import type { FinanceSnapshot } from '@/types/finance'
import { Button, Card, PageHeading, PanelHeading } from '@/ui/primitives'

function Overview({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [month, setMonth] = useReportMonth(snapshot)
  const { table, desktop, wide } = useWindowLayout()
  const transactions = transactionsForMonth(snapshot.transactions, month)
  const flow = getCashFlow(snapshot, month)
  const previous = flow.at(-2)
  const { income, expense } = summarizeTransactions(transactions)
  const incomeChange = changePercent(income, previous?.income)
  const expenseChange = changePercent(expense, previous?.expense)
  const balanceVnd = snapshot.accounts.reduce((total, account) => total + account.balanceVnd, 0)

  return (
    <>
      <PageHeading title="Tổng quan" description="Theo dõi số dư, thu chi và ngân sách cá nhân.">
        <PeriodSelect value={month} months={snapshot.months} onChange={setMonth} />
      </PageHeading>
      <View className={`gap-3 ${wide ? 'flex-row' : ''}`}>
        <BalanceCard balanceVnd={balanceVnd} accountCount={snapshot.accounts.length} asOfMonth={snapshot.latestMonth} />
        <MetricCard label="Thu nhập" amountVnd={income} icon={ArrowDownLeft} change={incomeChange} favorable={(incomeChange ?? 0) >= 0} />
        <MetricCard label="Chi tiêu" amountVnd={expense} icon={ArrowUpRight} tone="amber" change={expenseChange} favorable={(expenseChange ?? 0) <= 0} />
      </View>
      <View className={`gap-3 ${desktop ? 'flex-row' : ''}`}>
        <CashFlowChart points={flow} />
        <Card className="min-w-0 flex-1 gap-4 p-4 sm:p-5">
          <PanelHeading title="Ngân sách" description="Mức sử dụng theo danh mục">
            <Link href={{ pathname: '/ngan-sach', params: { thang: month } }} asChild>
              <Button label="Xem ngân sách" icon={ArrowRight} iconOnly variant="ghost" />
            </Link>
          </PanelHeading>
          {getBudgetUsage(snapshot, month).slice(0, 3).map((budget) => <BudgetProgress key={budget.categoryId} {...budget} />)}
        </Card>
      </View>
      <Card className="overflow-hidden">
        <View className="p-4 sm:p-5">
          <PanelHeading title="Giao dịch gần đây" description="Các khoản thu chi trong kỳ đã chọn">
            <Link href={{ pathname: '/giao-dich', params: { thang: month } }} asChild>
              <Button label="Xem giao dịch" icon={ArrowRight} />
            </Link>
          </PanelHeading>
        </View>
        <TransactionList transactions={transactions.slice(0, 5)} accounts={snapshot.accounts} compact table={table} />
      </Card>
    </>
  )
}

export default function DashboardPage() {
  return <FinanceState>{(snapshot) => <Overview snapshot={snapshot} />}</FinanceState>
}
