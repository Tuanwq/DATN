import { createHash } from 'node:crypto'
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library'
import { emailSchema, type AuthPlatform } from '@so-tien/shared/auth'
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
    authorizationUrl(state: string, nonce: string, verifier: string, isRegistration: boolean) {
      const url = new URL(client.generateAuthUrl({
        scope: isRegistration ? ['openid', 'email'] : ['openid'],
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
      return {
        subject: claims?.sub, nonce: claims?.nonce,
        email: claims?.email, emailVerified: claims?.email_verified,
      }
    },
  }
}

export type GoogleProvider = ReturnType<typeof createGoogleProvider>
export type VerifiedGoogleIdentity = Awaited<ReturnType<GoogleProvider['verifyIdToken']>> & { subject: string }

export async function createGoogleAttempt(db: Database, platform: AuthPlatform, isRegistration: boolean) {
  const attempt = createToken()
  const nonce = hashToken(createToken())
  const browserProof = platform === 'web' ? createToken() : null
  const verifier = browserProof ? createToken() : null
  await db.oAuthAttempt.create({
    data: {
      platform,
      isRegistration,
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

async function findGoogleUser(db: Database, subject: string) {
  const identity = await db.authIdentity.findUnique({
    where: { provider_providerSubject: { provider: 'google', providerSubject: subject } },
    select: { user: { select: { id: true, email: true } } },
  })
  return identity?.user
}

export async function resolveGoogleUser(db: Database, identity: VerifiedGoogleIdentity, isRegistration: boolean) {
  const existing = await findGoogleUser(db, identity.subject)
  if (existing) return existing
  if (!isRegistration) return 'GOOGLE_NOT_LINKED'

  const email = emailSchema.safeParse(identity.email)
  if (identity.emailVerified !== true || !email.success) return 'GOOGLE_EMAIL_UNVERIFIED'

  try {
    return await db.user.create({
      data: {
        email: email.data,
        identities: { create: { provider: 'google', providerSubject: identity.subject } },
      },
      select: { id: true, email: true },
    })
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
    // Another attempt can register the same Google subject while this request is in flight.
    const registered = await findGoogleUser(db, identity.subject)
    if (registered) return registered
    const emailOwner = await db.user.findUnique({ where: { email: email.data }, select: { id: true } })
    if (emailOwner) return 'EMAIL_ALREADY_REGISTERED'
    throw error
  }
}
