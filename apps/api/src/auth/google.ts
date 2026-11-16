import { createHash } from 'node:crypto'
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library'
import type { AuthPlatform } from '@so-tien/shared/auth'
import type { ApiConfig } from '../config.js'
import type { Database } from '../db.js'
import { Prisma } from '../generated/prisma/client.js'
import { createToken, hashToken } from './tokens.js'

export const GOOGLE_ATTEMPT_TTL_MS = 5 * 60 * 1000

export function createGoogleProvider(config: ApiConfig) {
  const client = new OAuth2Client({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: config.googleRedirectUri,
    transporterOptions: { timeout: 10_000 },
  })

  return {
    authorizationUrl(state: string, nonce: string, verifier: string) {
      const url = new URL(client.generateAuthUrl({
        scope: ['openid'],
        state,
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        code_challenge_method: CodeChallengeMethod.S256,
        prompt: 'select_account',
      }))
      url.searchParams.set('nonce', nonce)
      return url.href
    },
    async exchangeCode(code: string, verifier: string) {
      const { tokens } = await client.getToken({ code, codeVerifier: verifier })
      if (!tokens.id_token) throw new Error('Missing Google ID token')
      return tokens.id_token
    },
    async verifyIdToken(token: string) {
      const ticket = await client.verifyIdToken({ idToken: token, audience: config.googleClientId })
      const claims = ticket.getPayload()
      return { subject: claims?.sub, nonce: claims?.nonce }
    },
  }
}

export type GoogleProvider = ReturnType<typeof createGoogleProvider>

export async function createGoogleAttempt(db: Database, platform: AuthPlatform) {
  const attempt = createToken()
  const nonce = hashToken(createToken())
  const browserProof = platform === 'web' ? createToken() : null
  const verifier = browserProof ? createToken() : null
  await db.oAuthAttempt.create({
    data: {
      platform,
      tokenHash: hashToken(attempt),
      nonceHash: hashToken(nonce),
      browserHash: browserProof && hashToken(browserProof),
      verifier,
      expiresAt: new Date(Date.now() + GOOGLE_ATTEMPT_TTL_MS),
    },
  })
  return { attempt, nonce, browserProof, verifier }
}

export async function consumeGoogleAttempt(
  db: Database, attempt: string, platform: AuthPlatform, browserProof?: string,
) {
  const where = {
    tokenHash: hashToken(attempt),
    platform,
    browserHash: browserProof ? hashToken(browserProof) : null,
    expiresAt: { gt: new Date() },
  }
  try {
    return await db.oAuthAttempt.delete({ where })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return undefined
    throw error
  }
}

export async function findGoogleUser(db: Database, subject: string) {
  const identity = await db.authIdentity.findUnique({
    where: { provider_providerSubject: { provider: 'google', providerSubject: subject } },
    select: { user: { select: { id: true, email: true } } },
  })
  return identity?.user
}
