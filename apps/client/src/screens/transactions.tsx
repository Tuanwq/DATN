import { useState } from 'react'
import { Search } from 'lucide-react-native'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import { categories, CategoryIcon } from '@/components/native/category'
import { FinanceState, PeriodSelect } from '@/components/native/finance-state'
import { TransactionAmount, TransactionList } from '@/components/native/transaction-list'
import { useReportMonth } from '@/hooks/use-report-period'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { formatDate } from '@/lib/format'
import { transactionsForMonth } from '@/services/finance'
import type { FinanceSnapshot, Transaction } from '@/types/finance'
import { Dialog } from '@/ui/dialog'
import { AppText, Card, Input, MutedText, PageHeading, PanelHeading } from '@/ui/primitives'
import { Select } from '@/ui/select'

type TransactionFilter = 'all' | Transaction['type']

const typeLabels = { all: 'Tất cả loại', income: 'Thu nhập', expense: 'Chi tiêu' }
const typeOptions = [
  { value: 'all', label: typeLabels.all },
  { value: 'income', label: typeLabels.income },
  { value: 'expense', label: typeLabels.expense },
] as const

function TransactionDetails({ transaction, account }: { transaction: Transaction; account?: string }) {
  const fields = [
    { label: 'Loại', value: typeLabels[transaction.type] },
    { label: 'Danh mục', value: categories[transaction.categoryId].label },
    { label: 'Tài khoản', value: account ?? '—' },
    { label: 'Ngày', value: formatDate(transaction.date) },
  ]

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <CategoryIcon id={transaction.categoryId} />
        <AppText className="shrink text-base font-bold">{transaction.title}</AppText>
        <View className="ml-auto"><TransactionAmount transaction={transaction} /></View>
      </View>
      {fields.map(({ label, value }) => (
        <View key={label} className="flex-row flex-wrap justify-between gap-x-3 gap-y-1 border-t border-border pt-3">
          <MutedText>{label}</MutedText>
          <AppText className="shrink font-semibold">{value}</AppText>
        </View>
      ))}
    </View>
  )
}

function Transactions({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [month, setMonth] = useReportMonth(snapshot)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TransactionFilter>('all')
  const [selectedId, setSelectedId] = useState<string>()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { height } = useWindowDimensions()
  const { table, wide } = useWindowLayout()
  const split = wide && !table
  const term = query.trim().toLocaleLowerCase('vi')
  const rows = transactionsForMonth(snapshot.transactions, month).filter((item) => (
    (type === 'all' || item.type === type)
    && [item.title, categories[item.categoryId].label].some((text) => text.toLocaleLowerCase('vi').includes(term))
  ))
  const selected = rows.find((item) => item.id === selectedId) ?? (split ? rows[0] : undefined)
  const account = snapshot.accounts.find(({ id }) => id === selected?.accountId)

  function handleSelect(item: Transaction) {
    setSelectedId(item.id)
    setDetailsOpen(!wide)
  }

  const list = (
    <TransactionList
      transactions={rows}
      accounts={snapshot.accounts}
      table={table}
      selectedId={split ? selected?.id : undefined}
      onSelect={table ? undefined : handleSelect}
    />
  )

  return (
    <>
      <PageHeading title="Giao dịch" description="Tra cứu các khoản thu chi theo tháng.">
        <PeriodSelect value={month} months={snapshot.months} onChange={(value) => {
          setSelectedId(undefined)
          setMonth(value)
        }} />
      </PageHeading>
      <View className={`gap-3 ${split ? 'flex-row items-start' : ''}`}>
        <Card className={`min-w-0 overflow-hidden ${split ? 'flex-[1.55]' : ''}`}>
          <View className="gap-3 p-4 sm:p-5">
            <PanelHeading title="Danh sách giao dịch">
              <MutedText aria-live="polite" accessibilityLiveRegion="polite">{rows.length} giao dịch</MutedText>
            </PanelHeading>
            <View className="flex-row flex-wrap items-center gap-2.5">
              <Input
                icon={Search}
                className="min-w-[145px] flex-1"
                accessibilityLabel="Tìm giao dịch"
                placeholder="Tìm giao dịch"
                value={query}
                onChangeText={(value) => {
                  setSelectedId(undefined)
                  setQuery(value)
                }}
                returnKeyType="search"
              />
              <Select label="Loại giao dịch" value={type} options={typeOptions} onChange={(value) => {
                setSelectedId(undefined)
                setType(value)
              }} />
            </View>
          </View>
          {split ? (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: Math.max(220, height - 325) }}
            >
              {list}
            </ScrollView>
          ) : list}
        </Card>
        {split && (
          <Card className="min-w-0 flex-1 gap-4 p-4">
            <PanelHeading title="Chi tiết giao dịch" />
            {selected
              ? <TransactionDetails transaction={selected} account={account?.name} />
              : <MutedText>Chi tiết sẽ hiển thị khi có giao dịch phù hợp.</MutedText>}
          </Card>
        )}
      </View>
      {!wide && detailsOpen && selected && (
        <Dialog title="Chi tiết giao dịch" open onClose={() => setDetailsOpen(false)}>
          <TransactionDetails transaction={selected} account={account?.name} />
        </Dialog>
      )}
    </>
  )
}

export default function TransactionsPage() {
  return <FinanceState>{(snapshot) => <Transactions snapshot={snapshot} />}</FinanceState>
}
