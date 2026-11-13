import type { ReactNode } from 'react'
import { Pressable, Text, TextInput, View, type PressableProps, type TextInputProps, type TextProps, type ViewProps } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useTheme } from '@/hooks/use-appearance'

export type Tone = 'green' | 'amber' | 'blue' | 'rose'

const textColors = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  positive: 'text-positive',
  warning: 'text-warning',
  primary: 'text-primary-foreground',
  selected: 'text-nav-ink',
  white: 'text-white',
  balanceDetail: 'text-[#d1e9d9]',
}

export function AppText({ className = '', tone = 'default', ...props }: TextProps & { tone?: keyof typeof textColors }) {
  return <Text className={`${textColors[tone]} ${className}`} {...props} />
}

export function MutedText(props: TextProps) {
  return <AppText tone="muted" {...props} />
}

export function Card({ className = '', ...props }: ViewProps) {
  return <View className={`rounded-xl border border-border bg-card ${className}`} {...props} />
}

export function IconTile({ icon: Icon, tone = 'green' }: { icon: LucideIcon; tone?: Tone }) {
  const { colors } = useTheme()
  return (
    <View
      className="h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: colors[`${tone}-tile`] }}
      aria-hidden
    >
      <Icon size={17} color={colors[`${tone}-ink`]} />
    </View>
  )
}

export function Button({
  label, icon: Icon, iconOnly = false, variant = 'outline', className = '', ...props
}: PressableProps & {
  label: string
  icon?: LucideIcon
  iconOnly?: boolean
  variant?: 'outline' | 'primary' | 'ghost'
}) {
  const { colors } = useTheme()
  const filled = variant === 'primary'
  const variants = {
    primary: 'border-primary bg-primary hover:bg-primary-hover',
    outline: 'border-border bg-card hover:bg-muted',
    ghost: 'border-transparent hover:bg-muted',
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      className={`min-h-11 flex-row items-center justify-center gap-2 rounded-lg border active:opacity-75 focus:border-ring ${iconOnly ? 'w-11' : 'px-3'} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={17} color={filled ? colors['primary-foreground'] : colors.foreground} aria-hidden />}
      {!iconOnly && <AppText tone={filled ? 'primary' : 'default'} className="font-semibold">{label}</AppText>}
    </Pressable>
  )
}

export function Input({ icon: Icon, className = '', ...props }: TextInputProps & { icon?: LucideIcon }) {
  const { colors } = useTheme()
  return (
    <View className={`min-h-11 min-w-0 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 focus-within:border-ring ${className}`}>
      {Icon && <Icon size={17} color={colors['muted-foreground']} aria-hidden />}
      <TextInput
        className="min-w-0 flex-1 py-2 text-base text-foreground web:outline-none"
        placeholderTextColor={colors['muted-foreground']}
        selectionColor={colors.ring}
        {...props}
      />
    </View>
  )
}

export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <View className="flex-row flex-wrap items-end justify-between gap-3">
      <View className="shrink gap-1">
        <AppText accessibilityRole="header" aria-level={1} className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</AppText>
        <MutedText className="text-base">{description}</MutedText>
      </View>
      {children}
    </View>
  )
}

export function PanelHeading({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-3">
      <View className="shrink gap-1">
        <AppText accessibilityRole="header" aria-level={2} className="text-lg font-bold">{title}</AppText>
        {description && <MutedText>{description}</MutedText>}
      </View>
      {children}
    </View>
  )
}
