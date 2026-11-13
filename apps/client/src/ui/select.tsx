import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react-native'
import { useTheme } from '@/hooks/use-appearance'
import { Dialog } from '@/ui/dialog'
import { AppText } from '@/ui/primitives'

export function Select<Value extends string>({ label, value, options, onChange, icon: Icon }: {
  label: string
  value: Value
  options: readonly { value: Value; label: string }[]
  onChange: (value: Value) => void
  icon?: LucideIcon
}) {
  const [open, setOpen] = useState(false)
  const { colors } = useTheme()
  const selected = options.find((option) => option.value === value)?.label ?? label

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected}`}
        aria-expanded={open}
        onPress={() => setOpen(true)}
        className="min-h-11 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 hover:bg-muted active:opacity-75 focus:border-ring"
      >
        {Icon && <Icon size={16} color={colors['muted-foreground']} aria-hidden />}
        <AppText className="shrink font-semibold">{selected}</AppText>
        <ChevronDown size={16} color={colors['muted-foreground']} aria-hidden />
      </Pressable>
      <Dialog title={label} open={open} onClose={() => setOpen(false)}>
        <View className="gap-1">
          {options.map((option) => {
            const isSelected = value === option.value
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                aria-checked={isSelected}
                onPress={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`min-h-11 flex-row items-center justify-between gap-2 rounded-lg px-3 hover:bg-muted active:opacity-75 ${isSelected ? 'bg-nav-selected' : ''}`}
              >
                <AppText tone={isSelected ? 'selected' : 'default'} className={isSelected ? 'font-semibold' : ''}>{option.label}</AppText>
                {isSelected && <Check size={17} color={colors['nav-ink']} aria-hidden />}
              </Pressable>
            )
          })}
        </View>
      </Dialog>
    </>
  )
}
