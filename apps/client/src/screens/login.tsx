import { googleCallbackResultSchema, passwordLoginSchema } from '@so-tien/shared/auth'
import { useLocalSearchParams } from 'expo-router'
import Head from 'expo-router/head'
import { LockKeyhole, Mail, Wallet } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/use-appearance'
import { useAuth } from '@/hooks/use-auth'
import { AuthError } from '@/services/auth-api'
import { describeAuthError } from '@/services/auth-messages'
import { AppText, Button, Card, IconTile, Input } from '@/ui/primitives'

export default function LoginScreen() {
  const { colors } = useTheme()
  const { google } = useLocalSearchParams<{ google?: string }>()
  const busy = useAuth((state) => state.busy)
  const current = useAuth((state) => state.current)
  const login = useAuth((state) => state.login)
  const loginWithGoogle = useAuth((state) => state.loginWithGoogle)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [showInitialNotice, setShowInitialNotice] = useState(true)
  const callback = googleCallbackResultSchema.safeParse(google)
  const sessionError = current.status === 'signed-out' ? current.error : undefined
  const initialNotice = callback.success ? describeAuthError(new AuthError(callback.data)) : sessionError
  const notice = error ?? (showInitialNotice ? initialNotice : undefined)

  async function handlePasswordLogin() {
    if (busy) return
    setShowInitialNotice(false)
    const credentials = passwordLoginSchema.safeParse({ email, password })
    if (!credentials.success) {
      setError(describeAuthError(new AuthError('INVALID_REQUEST')))
      return
    }
    setError(undefined)
    try {
      await login(credentials.data)
    } catch (failure) {
      setError(describeAuthError(failure))
    } finally {
      setPassword('')
    }
  }

  async function handleGoogleLogin() {
    if (busy) return
    setShowInitialNotice(false)
    setError(undefined)
    try {
      await loginWithGoogle()
    } catch (failure) {
      setError(describeAuthError(failure))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Head><title>Đăng nhập · Sổ Tiền</title></Head>
      <ScrollView className="flex-1" contentContainerClassName="min-h-full justify-center px-5 py-10" keyboardShouldPersistTaps="handled">
        <View role="main" className="mx-auto w-full max-w-md gap-5">
          <View className="flex-row items-center gap-2.5">
            <IconTile icon={Wallet} />
            <AppText className="text-xl font-extrabold tracking-tight">Sổ Tiền</AppText>
          </View>
          <Card className="gap-5 p-5 sm:p-7">
            <AppText accessibilityRole="header" aria-level={1} className="text-3xl font-extrabold">Đăng nhập</AppText>
            <View className="gap-1.5">
              <AppText className="font-semibold">Email</AppText>
              <Input
                icon={Mail}
                accessibilityLabel="Email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!busy}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View className="gap-1.5">
              <AppText className="font-semibold">Mật khẩu</AppText>
              <Input
                icon={LockKeyhole}
                accessibilityLabel="Mật khẩu"
                autoComplete="current-password"
                autoCapitalize="none"
                secureTextEntry
                editable={!busy}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => void handlePasswordLogin()}
              />
            </View>
            {notice && (
              <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="warning">{notice}</AppText>
            )}
            <View className="gap-3">
              <Button
                label={busy === 'password' ? 'Đang đăng nhập…' : 'Đăng nhập'}
                variant="primary"
                disabled={!!busy}
                accessibilityState={{ busy: busy === 'password', disabled: !!busy }}
                onPress={() => void handlePasswordLogin()}
              />
              <Button
                label={busy === 'google' ? 'Đang kết nối Google…' : 'Đăng nhập bằng Google'}
                disabled={!!busy}
                accessibilityState={{ busy: busy === 'google', disabled: !!busy }}
                onPress={() => void handleGoogleLogin()}
              />
              {busy && <ActivityIndicator color={colors.foreground} />}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
