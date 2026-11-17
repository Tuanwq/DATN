import {
  authErrorResponseSchema, authSessionSchema, googleAttemptResponseSchema, loginResponseSchema,
  type AuthErrorCode, type GoogleAuthIntent, type PasswordLogin, type PasswordRegistration,
} from '@so-tien/shared/auth'
import { Platform } from 'react-native'

const platform = Platform.OS === 'web' ? 'web' : 'android'
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode | 'NETWORK_ERROR' | 'API_NOT_CONFIGURED' | 'STORAGE_ERROR') {
    super(code)
  }
}

function getApiUrl() {
  const configured = platform === 'web'
    ? process.env.EXPO_PUBLIC_WEB_API_URL
    : process.env.EXPO_PUBLIC_ANDROID_API_URL
  if (!configured && platform === 'web') return '/api/auth'
  let url: URL
  try {
    url = new URL(configured ?? '')
  } catch {
    throw new AuthError('API_NOT_CONFIGURED')
  }
  const localWebPreview = platform === 'web' && typeof window !== 'undefined' &&
    localHosts.has(url.hostname) && window.location.hostname === url.hostname
  const allowHttp = localWebPreview || (__DEV__ && platform === 'android')
  if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
    throw new AuthError('API_NOT_CONFIGURED')
  }
  if (url.pathname !== '/' || url.username || url.password || url.search || url.hash) {
    throw new AuthError('API_NOT_CONFIGURED')
  }
  return `${url.origin}/api/auth`
}

async function request(path: string, { post = false, body, token }: {
  post?: boolean
  body?: object
  token?: string
} = {}) {
  const url = `${getApiUrl()}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    const response = await fetch(url, {
      method: post ? 'POST' : 'GET',
      headers,
      credentials: platform === 'web' ? 'include' : 'omit',
      body: body && JSON.stringify(body),
      signal: controller.signal,
    })
    if (response.status === 204) return undefined
    const data: unknown = await response.json().catch(() => undefined)
    if (!response.ok) {
      throw new AuthError(authErrorResponseSchema.safeParse(data).data?.error ?? 'SERVER_ERROR')
    }
    return data
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError('NETWORK_ERROR')
  } finally {
    clearTimeout(timeout)
  }
}

export async function loginWithPassword(credentials: PasswordLogin) {
  const parsed = loginResponseSchema.safeParse(await request('/login', {
    post: true, body: { ...credentials, platform },
  }))
  if (!parsed.success) throw new AuthError('SERVER_ERROR')
  return parsed.data
}

export async function registerPasswordAccount(credentials: PasswordRegistration) {
  await request('/register', { post: true, body: { ...credentials, platform } })
}

export async function startGoogleAttempt(intent: GoogleAuthIntent) {
  const parsed = googleAttemptResponseSchema.safeParse(await request('/google/attempts', {
    post: true, body: { platform, intent },
  }))
  if (!parsed.success) throw new AuthError('SERVER_ERROR')
  return parsed.data
}

export async function loginWithGoogleToken(attempt: string, idToken: string) {
  const parsed = loginResponseSchema.safeParse(await request('/google/login', {
    post: true, body: { attempt, idToken },
  }))
  if (!parsed.success || !parsed.data.token) throw new AuthError('SERVER_ERROR')
  return parsed.data
}

export async function fetchSession(token?: string) {
  try {
    const parsed = authSessionSchema.safeParse(await request('/session', { token }))
    if (!parsed.success) throw new AuthError('SERVER_ERROR')
    return parsed.data
  } catch (error) {
    if (error instanceof AuthError && error.code === 'UNAUTHENTICATED') return null
    throw error
  }
}

export async function revokeSession(token?: string) {
  await request('/logout', { post: true, token })
}
