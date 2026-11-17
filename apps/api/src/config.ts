const CALLBACK_PATH = '/api/auth/google/callback'
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function readUrl(value: string, name: string, production: boolean) {
  const url = new URL(value)
  const isLocalHttp = !production && url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)
  if ((!isLocalHttp && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must use HTTPS or local development HTTP`)
  }
  return url
}

export function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production'
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const webUrl = readUrl(env.WEB_ORIGIN ?? 'http://localhost:8081', 'WEB_ORIGIN', production)
  if (webUrl.pathname !== '/') throw new Error('WEB_ORIGIN must be an origin')

  const googleClientId = env.GOOGLE_CLIENT_ID || undefined
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET || undefined
  const googleRedirectUri = env.GOOGLE_REDIRECT_URI || undefined
  if (googleClientSecret || googleRedirectUri) {
    if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
      throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are required for Web Google login')
    }
    const callbackUrl = readUrl(googleRedirectUri, 'GOOGLE_REDIRECT_URI', production)
    if (callbackUrl.pathname !== CALLBACK_PATH ||
        callbackUrl.hostname !== webUrl.hostname ||
        callbackUrl.protocol !== webUrl.protocol ||
        (production && callbackUrl.origin !== webUrl.origin)) {
      throw new Error('GOOGLE_REDIRECT_URI must use the Web origin and the Google callback path (same host in development)')
    }
  }

  const port = Number(env.PORT ?? 3001)
  const trustProxyHops = Number(env.TRUST_PROXY_HOPS ?? 0)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) throw new Error('Invalid TRUST_PROXY_HOPS')

  return {
    databaseUrl: env.DATABASE_URL,
    webOrigin: webUrl.origin,
    secureCookies: webUrl.protocol === 'https:',
    host: env.HOST ?? '127.0.0.1',
    port,
    trustProxyHops,
    googleClientId,
    googleClientSecret,
    googleRedirectUri,
  }
}

export type ApiConfig = ReturnType<typeof readConfig>
