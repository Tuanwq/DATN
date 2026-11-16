export type MonthKey = `${number}-${string}`

export type CategoryId =
  | 'salary' | 'freelance' | 'housing' | 'food' | 'shopping'
  | 'transport' | 'utilities' | 'health' | 'leisure'

export interface Transaction {
  id: string
  title: string
  type: 'income' | 'expense'
  amountVnd: number
  date: string
  categoryId: CategoryId
  accountId: string
}

export interface Account {
  id: string
  name: string
  type: 'bank' | 'wallet' | 'cash'
  reference: string
  balanceVnd: number
}

export interface Budget {
  categoryId: CategoryId
  limitVnd: number
}

export interface ForecastItem {
  categoryId: CategoryId
  estimateVnd: number
}

export interface FinanceSnapshot {
  latestMonth: MonthKey
  months: MonthKey[]
  accounts: Account[]
  budgets: Budget[]
  transactions: Transaction[]
  forecast: {
    month: MonthKey
    items: ForecastItem[]
  }
}

export interface FinanceRepository {
  getSnapshot(signal?: AbortSignal): Promise<FinanceSnapshot>
}
