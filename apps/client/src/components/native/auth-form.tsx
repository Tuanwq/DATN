import Head from 'expo-router/head'
import { Wallet } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, Card, IconTile } from '@/ui/primitives'

export function AuthForm({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Head><title>{title} · Sổ Tiền</title></Head>
      <ScrollView className="flex-1" contentContainerClassName="min-h-full justify-center px-5 py-10" keyboardShouldPersistTaps="handled">
        <View role="main" className="mx-auto w-full max-w-md gap-5">
          <View className="flex-row items-center gap-2.5">
            <IconTile icon={Wallet} />
            <AppText className="text-xl font-extrabold tracking-tight">Sổ Tiền</AppText>
          </View>
          <Card className="gap-5 p-5 sm:p-7">
            <AppText accessibilityRole="header" aria-level={1} className="text-3xl font-extrabold">{title}</AppText>
            {children}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
