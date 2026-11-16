import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { X } from 'lucide-react-native'
import { useTheme } from '@/hooks/use-appearance'
import { AppText, Button, Card } from '@/ui/primitives'

export function Dialog({ title, open, onClose, children }: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const { themeStyle } = useTheme()
  const { height } = useWindowDimensions()
  if (!open) return null

  return (
    <Modal transparent visible aria-label={title} onRequestClose={onClose} animationType="fade">
      <View className="flex-1 items-center justify-center px-4" style={themeStyle}>
        <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} accessible={false} focusable={false} aria-hidden />
        <Card className="w-full max-w-md p-4" style={{ maxHeight: height * 0.8 }}>
          <View className="mb-2 flex-row items-center justify-between gap-2">
            <AppText accessibilityRole="header" aria-level={2} className="shrink text-lg font-bold">{title}</AppText>
            <Button label="Đóng" icon={X} iconOnly variant="ghost" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Card>
      </View>
    </Modal>
  )
}
