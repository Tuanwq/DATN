import type { CategoryId, FinanceSnapshot, MonthKey, Transaction } from '@/types/finance'

export function transactionsForMonth(transactions: Transaction[], month: MonthKey) {
  return transactions.filter(({ date }) => date.startsWith(`${month}-`))
}

export function summarizeTransactions(transactions: Transaction[]) {
  return transactions.reduce(
    (totals, { amountVnd, type }) => ({ ...totals, [type]: totals[type] + amountVnd }),
    { income: 0, expense: 0 },
  )
}

export function expenseByCategory(transactions: Transaction[]) {
  const totals = new Map<CategoryId, number>()
  for (const { type, categoryId, amountVnd } of transactions) {
    if (type === 'expense') totals.set(categoryId, (totals.get(categoryId) ?? 0) + amountVnd)
  }
  return totals
}

export function getBudgetUsage(snapshot: FinanceSnapshot, month: MonthKey) {
  const expenses = expenseByCategory(transactionsForMonth(snapshot.transactions, month))
  return snapshot.budgets.map((budget) => ({
    ...budget,
    spentVnd: expenses.get(budget.categoryId) ?? 0,
  }))
}

export function getCashFlow(snapshot: FinanceSnapshot, month: MonthKey) {
  return snapshot.months.filter((item) => item <= month).slice(-6).map((item) => ({
    month: item,
    ...summarizeTransactions(transactionsForMonth(snapshot.transactions, item)),
  }))
}

export function changePercent(current: number, previous: number | undefined) {
  return previous ? (current - previous) / previous : null
}
