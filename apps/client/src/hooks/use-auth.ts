import { Platform } from 'react-native'
import { create } from 'zustand'
import type { AuthSession, GoogleAuthIntent, PasswordLogin, PasswordRegistration } from '@so-tien/shared/auth'
import { AuthError, fetchSession, loginWithPassword, registerPasswordAccount, revokeSession } from '@/services/auth-api'
import { describeAuthError } from '@/services/auth-messages'
import { signInWithGoogle } from '@/services/google-login'
import { clearToken, readToken, storeToken } from '@/services/session-storage'

type BusyAction = 'password' | 'register' | 'google' | 'logout'
type SessionState =
  | { status: 'checking' }
  | { status: 'unavailable'; error: string }
  | { status: 'signed-out'; error?: string }
  | { status: 'signed-in'; session: AuthSession }

interface AuthState {
  current: SessionState
  busy: BusyAction | null
  restore: () => Promise<void>
  expire: (session: AuthSession) => void
  login: (credentials: PasswordLogin) => Promise<void>
  register: (credentials: PasswordRegistration) => Promise<boolean>
  loginWithGoogle: (intent?: GoogleAuthIntent) => Promise<void>
  logout: () => Promise<void>
}

const web = Platform.OS === 'web'
let revision = 0
let restoring = false

async function readStoredToken() {
  try {
    return await readToken()
  } catch {
    throw new AuthError('STORAGE_ERROR')
  }
}

async function finishLogin(result: AuthSession & { token?: string }) {
  if (web) {
    const session = await fetchSession()
    if (!session) throw new AuthError('UNAUTHENTICATED')
    return session
  }

  const { token, user, expiresAt } = result
  if (!token) throw new AuthError('SERVER_ERROR')
  try {
    await storeToken(token)
  } catch {
    await revokeSession(token).catch(() => {})
    throw new AuthError('STORAGE_ERROR')
  }
  return { user, expiresAt }
}

export const useAuth = create<AuthState>((set, get) => {
  async function run(action: BusyAction, work: () => Promise<void>) {
    if (get().busy) return false
    revision += 1
    set({ busy: action })
    try {
      await work()
      return true
    } finally {
      set({ busy: null })
    }
  }

  return {
    current: { status: 'checking' },
    busy: null,
    async restore() {
      if (restoring || get().busy) return
      restoring = true
      const attempt = revision
      const previous = get().current
      if (previous.status === 'unavailable') set({ current: { status: 'checking' } })
      try {
        const token = await readStoredToken()
        const session = web || token ? await fetchSession(token ?? undefined) : null
        if (attempt !== revision) return
        if (session) {
          set({ current: { status: 'signed-in', session } })
        } else {
          const error = previous.status === 'signed-in'
            ? describeAuthError(new AuthError('UNAUTHENTICATED')) : undefined
          set({ current: { status: 'signed-out', error } })
        }
      } catch (error) {
        if (attempt !== revision || previous.status === 'signed-out') return
        if (previous.status === 'signed-in' && Date.parse(previous.session.expiresAt) > Date.now()) return
        set({ current: { status: 'unavailable', error: describeAuthError(error) } })
      } finally {
        restoring = false
      }
    },
    expire(session) {
      const current = get().current
      if (current.status !== 'signed-in' || current.session !== session) return
      revision += 1
      set({ current: {
        status: 'signed-out', error: describeAuthError(new AuthError('UNAUTHENTICATED')),
      } })
    },
    async login(credentials) {
      if (get().current.status !== 'signed-out') return
      await run('password', async () => {
        const session = await finishLogin(await loginWithPassword(credentials))
        set({ current: { status: 'signed-in', session } })
      })
    },
    async register(credentials) {
      if (get().current.status !== 'signed-out') return false
      return run('register', () => registerPasswordAccount(credentials))
    },
    async loginWithGoogle(intent = 'login') {
      if (get().current.status !== 'signed-out') return
      await run('google', async () => {
        const result = await signInWithGoogle(intent)
        if (result) {
          const session = await finishLogin(result)
          set({ current: { status: 'signed-in', session } })
        }
      })
    },
    async logout() {
      if (get().current.status !== 'signed-in') return
      await run('logout', async () => {
        const token = await readStoredToken()
        await revokeSession(token ?? undefined)
        await clearToken().catch(() => {})
        set({ current: { status: 'signed-out' } })
      })
    },
  }
})
