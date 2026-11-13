import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, usePathname, type Href } from 'expo-router'
import Head from 'expo-router/head'
import { StatusBar } from 'expo-status-bar'
import { ChartNoAxesCombined, ChartPie, ChevronRight, LayoutDashboard, Menu, Moon, ReceiptText, Settings, Sun, Target, Wallet } from 'lucide-react-native'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { useTheme } from '@/hooks/use-appearance'
import { useWindowLayout } from '@/hooks/use-window-layout'
import { Dialog } from '@/ui/dialog'
import { AppText, Button, MutedText } from '@/ui/primitives'

const navigation = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/giao-dich', label: 'Giao dịch', icon: ReceiptText },
  { to: '/tai-khoan', label: 'Tài khoản', icon: Wallet },
  { to: '/ngan-sach', label: 'Ngân sách', icon: Target },
  { to: '/thong-ke', label: 'Thống kê', icon: ChartPie },
  { to: '/du-bao', label: 'Dự báo', icon: ChartNoAxesCombined },
  { to: '/cai-dat', label: 'Cài đặt', icon: Settings },
] as const satisfies ReadonlyArray<{ to: Href; label: string; icon: typeof Wallet }>

function Brand() {
  return (
    <Link href="/" asChild>
      <Pressable accessibilityLabel="Sổ Tiền, về tổng quan" className="min-h-11 flex-row items-center gap-2.5 rounded-lg px-2 focus:bg-muted">
        <Svg width={36} height={36} viewBox="0 0 64 64" aria-hidden>
          <Rect width={64} height={64} rx={15} fill="#a1ffcb" />
          <Path d="M18 20h25a3 3 0 0 1 3 3v22H22a4 4 0 0 1-4-4V20Zm0 1 22-7v6m6 10H34a4 4 0 0 0 0 8h12" fill="none" stroke="#14392d" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={35} cy={34} r={1.7} fill="#14392d" />
        </Svg>
        <AppText className="text-xl font-extrabold tracking-tight">Sổ Tiền</AppText>
      </Pressable>
    </Link>
  )
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { colors } = useTheme()
  return (
    <View role="navigation" accessibilityLabel="Điều hướng chính" className="gap-1">
      {navigation.map(({ to, label, icon: Icon }) => {
        const selected = pathname === to
        return (
          <Link key={to} href={to} asChild>
            <Pressable
              aria-current={selected ? 'page' : undefined}
              onPress={onNavigate}
              className={`min-h-11 flex-row items-center gap-3 rounded-lg px-3 hover:bg-muted active:opacity-75 focus:bg-muted ${selected ? 'bg-nav-selected' : ''}`}
            >
              <Icon size={18} color={selected ? colors['nav-ink'] : colors['muted-foreground']} aria-hidden />
              <AppText tone={selected ? 'selected' : 'muted'} className={selected ? 'font-bold' : 'font-semibold'}>{label}</AppText>
            </Pressable>
          </Link>
        )
      })}
    </View>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const scroll = useRef<ScrollView>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const { colors, themeStyle, resolvedTheme, setTheme } = useTheme()
  const { desktop } = useWindowLayout()
  const label = navigation.find(({ to }) => to === pathname)?.label ?? 'Không tìm thấy trang'
  const dark = resolvedTheme === 'dark'

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false })
  }, [pathname])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <View className="flex-1 flex-row bg-background" style={themeStyle}>
        <Head><title>{`${label} · Sổ Tiền`}</title></Head>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {desktop && (
          <View className="w-56 border-r border-border bg-card p-4">
            <Brand />
            <ScrollView className="mt-8"><Navigation pathname={pathname} /></ScrollView>
            <View className="flex-row items-center gap-2 border-t border-border px-2 pt-4">
              <View className="h-2 w-2 rounded-full bg-chart-income" />
              <MutedText className="text-xs font-semibold">Dữ liệu mẫu</MutedText>
            </View>
          </View>
        )}
        <View className="min-w-0 flex-1">
          <View className="border-b border-border bg-card">
            <View className="mx-auto min-h-16 w-full max-w-[1440px] flex-row items-center justify-between gap-3 px-4 md:px-7">
              <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                {desktop ? (
                  <>
                    <MutedText className="font-semibold">Không gian cá nhân</MutedText>
                    <ChevronRight size={14} color={colors['muted-foreground']} aria-hidden />
                  </>
                ) : (
                  <Button label="Mở menu điều hướng" icon={Menu} iconOnly variant="ghost" onPress={() => setMenuOpen(true)} />
                )}
                <AppText className="shrink font-bold" numberOfLines={1}>{label}</AppText>
              </View>
              <Button
                label={dark ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
                icon={dark ? Sun : Moon}
                iconOnly
                onPress={() => setTheme(dark ? 'light' : 'dark')}
              />
            </View>
          </View>
          <ScrollView ref={scroll} className="flex-1" keyboardShouldPersistTaps="handled">
            <View role="main" className="mx-auto w-full max-w-[1440px] gap-4 px-4 pb-10 pt-5 md:gap-5 md:px-7 md:pt-7">
              {children}
            </View>
          </ScrollView>
        </View>
        {!desktop && (
          <Dialog title="Điều hướng" open={menuOpen} onClose={() => setMenuOpen(false)}>
            <Navigation pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <MutedText className="px-3 py-3 text-xs font-semibold">Dữ liệu mẫu</MutedText>
          </Dialog>
        )}
      </View>
    </SafeAreaView>
  )
}
