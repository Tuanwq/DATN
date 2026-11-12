import { Check, Monitor, Moon, Sun } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useTheme } from '@/hooks/use-appearance'
import { AppText, Card, MutedText, PageHeading, PanelHeading } from '@/ui/primitives'

const options = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Theo thiết bị', icon: Monitor },
] as const

const preferences = [
  { label: 'Ngôn ngữ', value: 'Tiếng Việt' },
  { label: 'Đơn vị tiền tệ', value: 'Việt Nam đồng (VND)' },
  { label: 'Định dạng ngày', value: 'Ngày/tháng/năm' },
]

export default function SettingsPage() {
  const { theme, setTheme, colors } = useTheme()

  return (
    <>
      <PageHeading title="Cài đặt" description="Tùy chỉnh giao diện và xem định dạng hiển thị." />
      <Card className="w-full max-w-2xl gap-4 p-4 sm:p-5">
        <PanelHeading title="Giao diện" />
        <View accessibilityRole="radiogroup" accessibilityLabel="Giao diện" className="flex-row flex-wrap gap-2">
          {options.map(({ value, label, icon: Icon }) => {
            const selected = theme === value
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={label}
                aria-checked={selected}
                onPress={() => setTheme(value)}
                className={`min-h-12 flex-row items-center gap-2 rounded-lg border px-3 hover:bg-muted active:opacity-75 focus:border-ring ${selected ? 'border-ring bg-nav-selected' : 'border-border'}`}
              >
                <Icon size={18} color={colors.foreground} aria-hidden />
                <AppText className="font-semibold">{label}</AppText>
                {selected && <Check size={16} color={colors['nav-ink']} aria-hidden />}
              </Pressable>
            )
          })}
        </View>
      </Card>
      <Card className="w-full max-w-2xl gap-4 p-4 sm:p-5">
        <PanelHeading title="Định dạng hiển thị" />
        {preferences.map(({ label, value }) => (
          <View key={label} className="flex-row flex-wrap justify-between gap-2 border-t border-border pt-3">
            <MutedText>{label}</MutedText>
            <AppText className="shrink font-semibold">{value}</AppText>
          </View>
        ))}
      </Card>
    </>
  )
}
