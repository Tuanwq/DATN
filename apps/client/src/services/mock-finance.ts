import type { Account, CategoryId, FinanceRepository, FinanceSnapshot, MonthKey, Transaction } from '@/types/finance'

const accounts: Account[] = [
  { id: 'bank', name: 'Tài khoản thanh toán', type: 'bank', reference: '•••• 4821', balanceVnd: 28_450_000 },
  { id: 'saving', name: 'Tiết kiệm', type: 'bank', reference: '•••• 9036', balanceVnd: 10_000_000 },
  { id: 'wallet', name: 'Ví điện tử', type: 'wallet', reference: 'Ví chi tiêu', balanceVnd: 2_850_000 },
  { id: 'cash', name: 'Tiền mặt', type: 'cash', reference: 'Tiền mang theo', balanceVnd: 1_550_000 },
]

const months: MonthKey[] = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
const incomeVnd = [20_500_000, 23_200_000, 22_100_000, 25_000_000, 23_800_000, 26_500_000]
const expenseVnd = [12_400_000, 15_800_000, 14_100_000, 18_300_000, 19_200_000, 17_250_000]

interface ExpenseSeed {
  day: string
  title: string
  categoryId: CategoryId
  accountId: string
  amountVnd: number
}

const expenseSeeds: ExpenseSeed[] = [
  { day: '31', title: 'Siêu thị cuối tuần', categoryId: 'food', accountId: 'bank', amountVnd: 780_000 },
  { day: '30', title: 'Cà phê và ăn trưa', categoryId: 'food', accountId: 'wallet', amountVnd: 235_000 },
  { day: '28', title: 'Mua đồ dùng gia đình', categoryId: 'shopping', accountId: 'bank', amountVnd: 1_150_000 },
  { day: '26', title: 'Đổ xăng', categoryId: 'transport', accountId: 'cash', amountVnd: 280_000 },
  { day: '24', title: 'Điện, nước và internet', categoryId: 'utilities', accountId: 'bank', amountVnd: 1_175_000 },
  { day: '22', title: 'Ăn ngoài', categoryId: 'food', accountId: 'bank', amountVnd: 940_000 },
  { day: '19', title: 'Sách và đồ dùng cá nhân', categoryId: 'shopping', accountId: 'wallet', amountVnd: 600_000 },
  { day: '17', title: 'Đi lại trong tháng', categoryId: 'transport', accountId: 'wallet', amountVnd: 920_000 },
  { day: '15', title: 'Khám sức khỏe', categoryId: 'health', accountId: 'bank', amountVnd: 650_000 },
  { day: '11', title: 'Vé xem phim', categoryId: 'leisure', accountId: 'wallet', amountVnd: 350_000 },
  { day: '08', title: 'Thực phẩm trong tuần', categoryId: 'food', accountId: 'bank', amountVnd: 1_295_000 },
  { day: '03', title: 'Tiền thuê nhà', categoryId: 'housing', accountId: 'bank', amountVnd: 8_875_000 },
]

const transactions = months.flatMap((month, index): Transaction[] => {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  const target = expenseVnd[index]
  const seedTotal = expenseSeeds.reduce((total, item) => total + item.amountVnd, 0)
  const expenses = expenseSeeds.map(({ day, ...expense }, expenseIndex): Transaction => ({
    ...expense,
    id: `${month}-expense-${expenseIndex}`,
    date: `${month}-${Math.min(Number(day), lastDay).toString().padStart(2, '0')}`,
    type: 'expense',
    amountVnd: Math.round(expense.amountVnd / seedTotal * target / 1000) * 1000,
  }))
  expenses[expenses.length - 1].amountVnd += target - expenses.reduce((total, item) => total + item.amountVnd, 0)

  return [
    ...expenses,
    { id: `${month}-salary`, title: 'Lương tháng', type: 'income', amountVnd: incomeVnd[index] - 2_500_000, date: `${month}-25`, categoryId: 'salary', accountId: 'bank' },
    { id: `${month}-freelance`, title: 'Thu nhập làm thêm', type: 'income', amountVnd: 2_500_000, date: `${month}-16`, categoryId: 'freelance', accountId: 'bank' },
  ]
}).sort((a, b) => b.date.localeCompare(a.date))

const snapshot: FinanceSnapshot = {
  latestMonth: '2026-10',
  months,
  accounts,
  transactions,
  budgets: [
    { categoryId: 'food', limitVnd: 4_000_000 },
    { categoryId: 'shopping', limitVnd: 3_000_000 },
    { categoryId: 'transport', limitVnd: 1_500_000 },
    { categoryId: 'housing', limitVnd: 9_000_000 },
    { categoryId: 'utilities', limitVnd: 1_200_000 },
  ],
  forecast: {
    month: '2026-11',
    items: [
      { categoryId: 'housing', estimateVnd: 8_875_000 },
      { categoryId: 'food', estimateVnd: 3_500_000 },
      { categoryId: 'shopping', estimateVnd: 2_100_000 },
      { categoryId: 'transport', estimateVnd: 1_340_000 },
      { categoryId: 'utilities', estimateVnd: 1_175_000 },
      { categoryId: 'health', estimateVnd: 660_000 },
      { categoryId: 'leisure', estimateVnd: 450_000 },
    ],
  },
}

export const mockFinanceRepository: FinanceRepository = {
  async getSnapshot(signal) {
    if (signal?.aborted) throw new Error('Finance snapshot request was aborted')
    return {
      ...snapshot,
      months: [...snapshot.months],
      accounts: snapshot.accounts.map((account) => ({ ...account })),
      transactions: snapshot.transactions.map((transaction) => ({ ...transaction })),
      budgets: snapshot.budgets.map((budget) => ({ ...budget })),
      forecast: {
        ...snapshot.forecast,
        items: snapshot.forecast.items.map((item) => ({ ...item })),
      },
    }
  },
}
