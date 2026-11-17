import type { ReactNode } from 'react'
import { useState } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import {
  Bell, CalendarDays, Check, ChevronDown, ChevronRight, Cloud, Coins, Ellipsis, Globe2,
  Layers, LogOut, Monitor, Moon, Palette, ShieldCheck, SlidersHorizontal, Sun, Type,
  type LucideIcon,
} from 'lucide-react-native'
import { useTheme } from '@/hooks/use-appearance'
import { useAuth } from '@/hooks/use-auth'
import { describeAuthError } from '@/services/auth-messages'
import palette from '@/theme/palette.json'
import { AppText, Button, Card, MutedText, PageHeading } from '@/ui/primitives'

const sections = [
  { id: 'appearance', title: 'Giao diện & hiển thị', description: 'Chế độ, màu sắc, cỡ chữ', icon: Monitor },
  { id: 'account', title: 'Tài khoản & bảo mật', description: 'Thông tin, mật khẩu, đăng xuất', icon: ShieldCheck },
  { id: 'data', title: 'Dữ liệu & đồng bộ', description: 'Sao lưu, đồng bộ, khôi phục', icon: Cloud },
  { id: 'notifications', title: 'Thông báo', description: 'Nhắc nhở, lịch trình, giao dịch', icon: Bell },
  { id: 'region', title: 'Đơn vị & định dạng', description: 'Tiền tệ, ngày tháng, ngôn ngữ', icon: Layers },
  { id: 'other', title: 'Khác', description: 'Giới thiệu và chính sách', icon: Ellipsis },
] as const

type SettingsSection = typeof sections[number]['id']

const themeOptions = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Theo thiết bị', icon: Monitor },
] as const

const accentPreviews = ['#176b43', '#2479d1', '#18b975', '#89bc35', '#e18911', '#df5b7b']
const textSizePreviews = ['Nhỏ', 'Vừa', 'Lớn']

const regionRows = [
  { label: 'Ngôn ngữ', value: 'Tiếng Việt', icon: Globe2 },
  { label: 'Đơn vị tiền tệ', value: 'Việt Nam đồng (VND)', icon: Coins },
  { label: 'Định dạng ngày', value: 'Ngày/tháng/năm (dd/MM/yyyy)', icon: CalendarDays },
] as const

const previewRows = {
  data: ['Sao lưu dữ liệu', 'Đồng bộ thiết bị', 'Khôi phục dữ liệu'],
  notifications: ['Nhắc nhập giao dịch', 'Lịch nhắc định kỳ', 'Thông báo giao dịch'],
  other: ['Giới thiệu Sổ Tiền', 'Chính sách quyền riêng tư'],
}

const controlFeedback = 'hover:bg-muted active:opacity-75 focus-visible:border-ring web:focus-visible:ring-2 web:focus-visible:ring-ring'

function PanelTitle({ icon: Icon, title, description }: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  const { colors } = useTheme()
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-8 w-8 shrink-0 items-center justify-center">
        <Icon size={22} color={colors.foreground} aria-hidden />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <AppText accessibilityRole="header" aria-level={2} className="text-xl font-extrabold tracking-tight">
          {title}
        </AppText>
        {description && <MutedText>{description}</MutedText>}
      </View>
    </View>
  )
}

function SettingsNavigation({ email, section, onSelect, split }: {
  email?: string
  section: SettingsSection
  onSelect: (section: SettingsSection) => void
  split: boolean
}) {
  const { colors } = useTheme()
  return (
    <Card className={`gap-3 rounded-2xl p-3 ${split ? 'w-[27%] min-w-[230px] max-w-[340px]' : 'w-full'}`}>
      {email && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tài khoản ${email}`}
          onPress={() => onSelect('account')}
          className={`min-h-[68px] flex-row items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 ${controlFeedback}`}
        >
          <View className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-tile" aria-hidden>
            <AppText tone="selected" className="text-xl font-extrabold">{email.slice(0, 1).toUpperCase()}</AppText>
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <AppText className="font-extrabold">Tài khoản</AppText>
            <MutedText numberOfLines={1} className="text-sm">{email}</MutedText>
          </View>
          <ChevronRight size={17} color={colors['muted-foreground']} aria-hidden />
        </Pressable>
      )}
      <View role="navigation" accessibilityLabel="Các mục cài đặt" className={split ? 'gap-1.5' : 'flex-row flex-wrap justify-between gap-y-1.5'}>
        {sections.map(({ id, title, description, icon: Icon }) => {
          const selected = section === id
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={title}
              aria-current={selected ? 'true' : undefined}
              onPress={() => onSelect(id)}
              className={`min-h-12 flex-row items-center rounded-xl border border-transparent ${controlFeedback} ${selected ? 'bg-nav-selected hover:bg-nav-selected' : ''} ${split ? 'min-h-[62px] gap-3 px-2.5 py-2' : 'w-[49%] gap-2 px-1.5 py-1.5'}`}
            >
              <View
                className={`shrink-0 items-center justify-center rounded-xl ${split ? 'h-10 w-10' : 'h-8 w-8'} ${selected ? 'bg-nav-selected' : 'bg-muted'}`}
                aria-hidden
              >
                <Icon size={split ? 21 : 17} color={selected ? colors['nav-ink'] : colors.foreground} />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <AppText tone={selected ? 'selected' : 'default'} className="text-sm font-bold">{title}</AppText>
                {split && <MutedText className="text-xs">{description}</MutedText>}
              </View>
            </Pressable>
          )
        })}
      </View>
    </Card>
  )
}

function PreviewWindow({ dark, showRail = true }: { dark: boolean; showRail?: boolean }) {
  const preview = dark ? palette.dark : palette.light
  return (
    <View
      className="min-w-0 flex-1"
      style={{ backgroundColor: preview.card }}
    >
      <View className="h-3 flex-row items-center gap-[3px] px-1.5" style={{ backgroundColor: preview.border }}>
        {[0, 1, 2].map((dot) => (
          <View key={dot} className="h-1 w-1 rounded-full" style={{ backgroundColor: preview['muted-foreground'], opacity: dot === 0 ? 0.65 : 0.34 }} />
        ))}
      </View>
      <View className="flex-1 flex-row gap-1.5 px-1.5 py-1 sm:gap-2 sm:px-2 sm:py-1.5">
        {showRail && (
          <View className="w-[17%] gap-[3px] sm:gap-1">
            {[0, 1, 2].map((row) => (
              <View key={row} className="h-1.5 rounded-full sm:h-2" style={{ backgroundColor: row === 0 ? preview['chart-expense'] : preview['green-tile'] }} />
            ))}
          </View>
        )}
        <View className="flex-1 gap-[3px] sm:gap-1">
          {(['65%', '100%', '86%'] as const).map((width) => (
            <View
              key={width}
              className="h-1.5 rounded-full sm:h-2"
              style={{ width, backgroundColor: preview.muted }}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

function ThemeCards({ compact }: { compact: boolean }) {
  const { theme, setTheme, colors } = useTheme()
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Chế độ giao diện" className="flex-row gap-2 sm:gap-3">
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const selected = theme === value
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={label}
            aria-checked={selected}
            onPress={() => setTheme(value)}
            className={`min-w-0 flex-1 items-center gap-2.5 rounded-xl border p-2 sm:p-3 ${controlFeedback} ${selected ? 'border-ring bg-nav-selected hover:bg-nav-selected' : 'border-border bg-background'}`}
          >
            <View className="h-11 w-full max-w-[188px] flex-row overflow-hidden rounded-md border border-border sm:h-[62px]" aria-hidden>
              <PreviewWindow dark={value === 'dark'} />
              {value === 'system' && <PreviewWindow dark showRail={false} />}
            </View>
            {selected && (
              <View className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-primary sm:right-2 sm:top-2" aria-hidden>
                <Check size={13} color={colors['primary-foreground']} strokeWidth={3} />
              </View>
            )}
            <View className={`items-center justify-center ${compact ? 'gap-1' : 'flex-row gap-1.5'}`}>
              <Icon size={compact ? 15 : 18} color={selected ? colors['nav-ink'] : colors.foreground} aria-hidden />
              <AppText tone={selected ? 'selected' : 'default'} className="text-center text-xs font-bold sm:text-sm">
                {label}
              </AppText>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

function SettingRow({ icon: Icon, title, description, tail, separated = false, compact = false }: {
  icon: LucideIcon
  title: string
  description?: string
  tail: ReactNode
  separated?: boolean
  compact?: boolean
}) {
  const { colors } = useTheme()
  return (
    <View className={`gap-2.5 px-2.5 py-2.5 sm:px-3 ${separated ? 'border-t border-border' : ''} ${compact ? 'items-stretch' : 'flex-row items-center justify-between'}`}>
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted" aria-hidden>
          <Icon size={18} color={colors.foreground} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <AppText className="font-semibold">{title}</AppText>
          {description && <MutedText className="text-xs sm:text-sm">{description}</MutedText>}
        </View>
      </View>
      {tail}
    </View>
  )
}

function DisplayOptions({ compact }: { compact: boolean }) {
  return (
    <View className="gap-2 border-t border-border pt-3.5">
      <AppText accessibilityRole="header" aria-level={3} className="font-bold">Tùy chỉnh hiển thị</AppText>
      <View className="rounded-xl border border-border">
        <SettingRow
          title="Màu chủ đạo"
          description="Màu nhấn cho ứng dụng"
          icon={Palette}
          compact={compact}
          tail={(
            <View
              accessible
              accessibilityLabel="Màu chủ đạo, xanh lá"
              aria-disabled
              className="min-h-10 flex-row items-center justify-between gap-2 sm:gap-3"
            >
              {accentPreviews.map((color, index) => (
                <View key={color} className="h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8" style={{ backgroundColor: color }} aria-hidden>
                  {index === 0 && <Check size={16} color="#ffffff" strokeWidth={2.6} />}
                </View>
              ))}
            </View>
          )}
        />
        <SettingRow
          title="Kích thước chữ"
          description="Cỡ chữ trong ứng dụng"
          icon={Type}
          compact={compact}
          separated
          tail={(
            <View
              accessible
              accessibilityLabel="Kích thước chữ, vừa"
              aria-disabled
              className="min-h-10 flex-row items-stretch rounded-lg border border-border bg-background p-0.5 sm:w-[220px]"
            >
              {textSizePreviews.map((size) => (
                <View key={size} className={`flex-1 items-center justify-center rounded-md ${size === 'Vừa' ? 'bg-nav-selected' : ''}`}>
                  <AppText tone={size === 'Vừa' ? 'selected' : 'muted'} className="text-sm font-semibold">{size}</AppText>
                </View>
              ))}
            </View>
          )}
        />
      </View>
    </View>
  )
}

function RegionPanel({ compact }: { compact: boolean }) {
  const { colors } = useTheme()
  return (
    <Card className="gap-2 rounded-2xl p-3.5 sm:p-5">
      <PanelTitle icon={SlidersHorizontal} title="Định dạng & khu vực" />
      <View>
        {regionRows.map(({ label, value, icon }, index) => (
          <SettingRow
            key={label}
            title={label}
            icon={icon}
            separated={index > 0}
            compact={compact}
            tail={(
              <View
                accessibilityRole="button"
                accessibilityLabel={`${label}, ${value}`}
                aria-disabled
                className="min-h-11 max-w-full flex-row items-center justify-between gap-2 self-start rounded-lg border border-border bg-background px-3 sm:self-auto"
              >
                <AppText className="shrink text-sm font-semibold">{value}</AppText>
                <ChevronDown size={16} color={colors['muted-foreground']} aria-hidden />
              </View>
            )}
          />
        ))}
      </View>
    </Card>
  )
}

export default function SettingsPage() {
  const current = useAuth((state) => state.current)
  const busy = useAuth((state) => state.busy)
  const logout = useAuth((state) => state.logout)
  const { width } = useWindowDimensions()
  const [section, setSection] = useState<SettingsSection>('appearance')
  const [error, setError] = useState<string>()
  const selected = sections.find(({ id }) => id === section)!
  const email = current.status === 'signed-in' ? current.session.user.email : undefined
  const split = width >= 900
  const compact = width < 600

  async function handleLogout() {
    setError(undefined)
    try {
      await logout()
    } catch (failure) {
      setError(describeAuthError(failure))
    }
  }

  return (
    <>
      <PageHeading title="Cài đặt" description="Tùy chỉnh ứng dụng theo cách bạn muốn." />
      <View className={`gap-3 sm:gap-4 ${split ? 'flex-row items-stretch' : ''}`}>
        <SettingsNavigation email={email} section={section} onSelect={setSection} split={split} />
        <View className={`min-w-0 gap-3 sm:gap-4 ${split ? 'flex-1' : ''}`}>
          {section === 'appearance' && (
            <Card className="gap-4 rounded-2xl p-3.5 sm:gap-5 sm:p-5">
              <PanelTitle icon={Monitor} title="Giao diện" description="Chọn cách hiển thị phù hợp với bạn." />
              <ThemeCards compact={compact} />
              <DisplayOptions compact={compact} />
            </Card>
          )}
          {(section === 'appearance' || section === 'region') && <RegionPanel compact={compact} />}
          {section === 'account' && (
            <Card className="gap-3 rounded-2xl p-3.5 sm:p-5">
              <PanelTitle icon={ShieldCheck} title="Tài khoản & bảo mật" />
              {email && (
                <View className="gap-1 border-b border-border pb-3">
                  <MutedText className="text-sm">Email</MutedText>
                  <AppText selectable className="font-semibold">{email}</AppText>
                </View>
              )}
              <Button label="Đổi mật khẩu" icon={ShieldCheck} disabled accessibilityState={{ disabled: true }} className="self-start bg-background" />
              {error && <AppText accessibilityRole="alert" tone="warning">{error}</AppText>}
              {email && (
                <Button
                  label={busy === 'logout' ? 'Đang đăng xuất…' : 'Đăng xuất'}
                  icon={LogOut}
                  className={`self-start ${controlFeedback}`}
                  disabled={!!busy}
                  accessibilityState={{ busy: busy === 'logout', disabled: !!busy }}
                  onPress={() => void handleLogout()}
                />
              )}
            </Card>
          )}
          {(section === 'data' || section === 'notifications' || section === 'other') && (
            <Card className="gap-3 rounded-2xl p-3.5 sm:p-5">
              <PanelTitle icon={selected.icon} title={selected.title} />
              <View className="gap-2">
                {previewRows[section].map((label) => (
                  <Button key={label} label={label} disabled accessibilityState={{ disabled: true }} className="justify-start bg-background" />
                ))}
              </View>
            </Card>
          )}
        </View>
      </View>
    </>
  )
}
