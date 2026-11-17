import {
  MIN_REGISTRATION_PASSWORD_LENGTH, googleCallbackResultSchema,
  passwordRegistrationSchema, registrationErrorCode,
} from '@so-tien/shared/auth'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { LockKeyhole, Mail } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AuthForm } from '@/components/native/auth-form'
import { useTheme } from '@/hooks/use-appearance'
import { useAuth } from '@/hooks/use-auth'
import { AuthError } from '@/services/auth-api'
import { describeAuthError } from '@/services/auth-messages'
import { AppText, Button, Input } from '@/ui/primitives'

export default function RegisterScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { google } = useLocalSearchParams<{ google?: string }>()
  const busy = useAuth((state) => state.busy)
  const register = useAuth((state) => state.register)
  const loginWithGoogle = useAuth((state) => state.loginWithGoogle)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string>()
  const [showCallbackNotice, setShowCallbackNotice] = useState(true)
  const callback = googleCallbackResultSchema.safeParse(google)
  const notice = error ?? (showCallbackNotice && callback.success
    ? describeAuthError(new AuthError(callback.data)) : undefined)

  async function handleRegister() {
    if (busy) return
    setShowCallbackNotice(false)
    const credentials = passwordRegistrationSchema.safeParse({ email, password, passwordConfirmation })
    if (!credentials.success) {
      setError(describeAuthError(new AuthError(registrationErrorCode(credentials.error.issues))))
      return
    }

    setError(undefined)
    try {
      if (await register(credentials.data)) {
        router.dismissTo({ pathname: '/dang-nhap', params: { registered: '1' } })
      }
    } catch (failure) {
      setError(describeAuthError(failure))
    }
  }

  async function handleGoogleRegistration() {
    if (busy) return
    setShowCallbackNotice(false)
    setError(undefined)
    try {
      await loginWithGoogle('register')
    } catch (failure) {
      setError(describeAuthError(failure))
    }
  }

  return (
    <AuthForm title="Đăng ký">
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
          autoComplete="new-password"
          autoCapitalize="none"
          secureTextEntry
          editable={!busy}
          value={password}
          onChangeText={setPassword}
        />
        <AppText tone="muted" className="text-sm">Ít nhất {MIN_REGISTRATION_PASSWORD_LENGTH} ký tự.</AppText>
      </View>
      <View className="gap-1.5">
        <AppText className="font-semibold">Xác nhận mật khẩu</AppText>
        <Input
          icon={LockKeyhole}
          accessibilityLabel="Xác nhận mật khẩu"
          autoComplete="new-password"
          autoCapitalize="none"
          secureTextEntry
          editable={!busy}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          onSubmitEditing={() => void handleRegister()}
        />
      </View>
      {notice && (
        <AppText accessibilityRole="alert" accessibilityLiveRegion="polite" tone="warning">{notice}</AppText>
      )}
      <View className="gap-3">
        <Button
          label={busy === 'register' ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          variant="primary"
          disabled={!!busy}
          accessibilityState={{ busy: busy === 'register', disabled: !!busy }}
          onPress={() => void handleRegister()}
        />
        <Button
          label={busy === 'google' ? 'Đang kết nối Google…' : 'Đăng ký bằng Google'}
          disabled={!!busy}
          accessibilityState={{ busy: busy === 'google', disabled: !!busy }}
          onPress={() => void handleGoogleRegistration()}
        />
        <Link href="/dang-nhap" dismissTo asChild>
          <Button label="Quay lại đăng nhập" variant="ghost" accessibilityRole="link" disabled={!!busy} />
        </Link>
        {busy && <ActivityIndicator color={colors.foreground} />}
      </View>
    </AuthForm>
  )
}
