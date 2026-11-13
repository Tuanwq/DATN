import { Banknote, CreditCard, Wallet } from 'lucide-react-native'
import { View } from 'react-native'
import { BalanceCard } from '@/components/native/finance-cards'
import { FinanceState } from '@/components/native/finance-state'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { formatVnd } from '@/lib/format'
import { AppText, Card, IconTile, MutedText, PageHeading, PanelHeading } from '@/ui/primitives'

const accountTypes = {
  bank: { icon: CreditCard, label: 'Ngân hàng', tone: 'green' },
  wallet: { icon: Wallet, label: 'Ví điện tử', tone: 'blue' },
  cash: { icon: Banknote, label: 'Tiền mặt', tone: 'amber' },
} as const

export default function AccountsPage() {
  const { wide } = useWindowLayout()
  return (
    <>
      <PageHeading title="Tài khoản" description="Xem số dư ở từng ngân hàng, ví điện tử và tiền mặt." />
      <FinanceState>{({ accounts, latestMonth }) => (
        <>
          <View className="w-full max-w-xl">
            <BalanceCard balanceVnd={accounts.reduce((total, account) => total + account.balanceVnd, 0)} accountCount={accounts.length} asOfMonth={latestMonth} />
          </View>
          <PanelHeading title="Danh sách tài khoản" />
          <View className={`gap-3 ${wide ? 'flex-row flex-wrap' : ''}`}>
            {accounts.map(({ id, type, name, reference, balanceVnd }) => {
              const { icon, label, tone } = accountTypes[type]
              return (
                <Card key={id} className={`gap-3 p-5 ${wide ? 'w-[48%] grow' : ''}`}>
                  <View className="flex-row items-center gap-2">
                    <IconTile icon={icon} tone={tone} />
                    <MutedText className="font-semibold">{label}</MutedText>
                  </View>
                  <View className="gap-1">
                    <AppText className="text-base font-bold">{name}</AppText>
                    <MutedText>{reference}</MutedText>
                  </View>
                  <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <MutedText>Số dư</MutedText>
                    <AppText className="text-lg font-bold">{formatVnd(balanceVnd)}</AppText>
                  </View>
                </Card>
              )
            })}
          </View>
        </>
      )}</FinanceState>
    </>
  )
}
