import { Pressable, View } from 'react-native'
import { ReceiptText } from 'lucide-react-native'
import { categories, CategoryIcon } from '@/components/native/category'
import { useTheme } from '@/hooks/use-appearance'
import { formatDate, formatVnd } from '@/lib/format'
import type { Account, Transaction } from '@/types/finance'
import { AppText, MutedText } from '@/ui/primitives'

const columns = {
  title: 'min-w-0 flex-[2.25]',
  category: 'min-w-0 flex-1',
  account: 'min-w-0 flex-[1.35]',
  date: 'w-24',
  amount: 'w-28 text-right',
}

export function TransactionAmount({ transaction }: { transaction: Transaction }) {
  const { type, amountVnd } = transaction
  return (
    <AppText tone={type === 'income' ? 'positive' : 'default'} className="text-right font-bold tabular-nums">
      {type === 'income' ? '+' : '−'}{formatVnd(amountVnd)}
    </AppText>
  )
}

export function TransactionList({ transactions, accounts, table = false, compact = false, selectedId, onSelect }: {
  transactions: Transaction[]
  accounts: Account[]
  table?: boolean
  compact?: boolean
  selectedId?: string
  onSelect?: (transaction: Transaction) => void
}) {
  const { colors } = useTheme()
  const accountNames = new Map(accounts.map(({ id, name }) => [id, name]))

  if (!transactions.length) {
    return (
      <View className="items-center gap-3 px-4 py-10">
        <ReceiptText size={25} color={colors['muted-foreground']} aria-hidden />
        <MutedText className="text-center">Không tìm thấy giao dịch phù hợp.</MutedText>
      </View>
    )
  }

  return (
    <View role={table ? 'table' : undefined} aria-label={table ? 'Danh sách giao dịch' : undefined}>
      {table && (
        <View role="row" className="flex-row items-center gap-3 border-y border-border bg-muted px-4 py-3">
          <MutedText role="columnheader" className={columns.title}>Giao dịch</MutedText>
          <MutedText role="columnheader" className={columns.category}>Danh mục</MutedText>
          {!compact && <MutedText role="columnheader" className={columns.account}>Tài khoản</MutedText>}
          <MutedText role="columnheader" className={columns.date}>Ngày</MutedText>
          <MutedText role="columnheader" className={columns.amount}>Số tiền</MutedText>
        </View>
      )}
      {transactions.map((item) => {
        const { id, title, date, categoryId, accountId } = item
        const category = categories[categoryId].label
        const selected = selectedId === id
        const className = `min-h-16 flex-row items-center gap-3 border-t border-border px-4 py-3 ${selected ? 'bg-nav-selected' : ''}`
        const name = (
          <View className={`flex-row items-center gap-2.5 ${table ? columns.title : 'min-w-0 flex-1'}`} role={table ? 'cell' : undefined}>
            <CategoryIcon id={categoryId} />
            <View className="min-w-0 flex-1 gap-0.5">
              <AppText className="font-semibold">{title}</AppText>
              {!table && <MutedText className="text-xs">{category} · {formatDate(date)}</MutedText>}
            </View>
          </View>
        )

        if (table) {
          return (
            <View key={id} role="row" className={className}>
              {name}
              <MutedText role="cell" className={columns.category}>{category}</MutedText>
              {!compact && <MutedText role="cell" className={columns.account}>{accountNames.get(accountId) ?? '—'}</MutedText>}
              <MutedText role="cell" className={columns.date}>{formatDate(date)}</MutedText>
              <View role="cell" className="w-28"><TransactionAmount transaction={item} /></View>
            </View>
          )
        }

        const content = <>{name}<View className="max-w-[42%] shrink"><TransactionAmount transaction={item} /></View></>
        return onSelect ? (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={selectedId === undefined ? undefined : { selected }}
            aria-current={selected || undefined}
            onPress={() => onSelect(item)}
            className={`${className} hover:bg-muted active:opacity-75`}
          >
            {content}
          </Pressable>
        ) : <View key={id} className={className}>{content}</View>
      })}
    </View>
  )
}
