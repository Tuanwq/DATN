import { parse } from 'cookie'
import { Router, type Request, type Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  authTokenSchema, googleAttemptRequestSchema, googleLoginRequestSchema, loginRequestSchema,
  type AuthErrorCode, type AuthPlatform, type AuthSession, type GoogleCallbackResult,
} from '@so-tien/shared/auth'
import type { ApiConfig } from '../config.js'
import type { Database } from '../db.js'
import {
  consumeGoogleAttempt, createGoogleAttempt, findGoogleUser, GOOGLE_ATTEMPT_TTL_MS,
  type GoogleProvider,
} from './google.js'
import { createPasswordAuthenticator } from './password.js'
import { createSession, findSession, revokeSession } from './sessions.js'
import { hashToken } from './tokens.js'

function sendError(res: Response, status: number, error: AuthErrorCode) {
  res.status(status).json({ error })
}

function loginRateLimit(limit: number) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, 429, 'RATE_LIMITED'),
  })
}

function readCookie(req: Request, name: string) {
  return authTokenSchema.safeParse(parse(req.headers.cookie ?? '')[name]).data
}

function readSessionToken(req: Request, sessionCookie: string) {
  if (req.headers.authorization !== undefined) {
    if (req.headers.origin) return undefined
    const match = /^Bearer (\S+)$/i.exec(req.headers.authorization)
    return authTokenSchema.safeParse(match?.[1]).data
  }
  return readCookie(req, sessionCookie)
}

export function createAuthRouter(config: ApiConfig, db: Database, google: GoogleProvider) {
  const router = Router()
  const authenticatePassword = createPasswordAuthenticator(db)
  const cookiePrefix = config.secureCookies ? '__Host-' : ''
  const sessionCookie = `${cookiePrefix}sotien_session`
  const googleCookie = `${cookiePrefix}sotien_google`
  const cookieOptions = { httpOnly: true, secure: config.secureCookies, path: '/' }
  const sessionCookieOptions = { ...cookieOptions, sameSite: 'strict' as const }
  const googleCookieOptions = { ...cookieOptions, sameSite: 'lax' as const }

  function allowsPlatform(req: Request, platform: AuthPlatform) {
    return platform === 'web' ? req.headers.origin === config.webOrigin : !req.headers.origin
  }

  function setWebSession(res: Response, token: string, session: AuthSession) {
    res.cookie(sessionCookie, token, { ...sessionCookieOptions, expires: new Date(session.expiresAt) })
  }

  function redirectGoogle(res: Response, result?: GoogleCallbackResult) {
    const destination = new URL(result ? '/dang-nhap' : '/', config.webOrigin)
    if (result) destination.searchParams.set('google', result)
    res.redirect(303, destination.href)
  }

  async function verifyGoogleSubject(idToken: string, nonceHash: string) {
    try {
      const { subject, nonce } = await google.verifyIdToken(idToken)
      if (typeof nonce === 'string' && hashToken(nonce) === nonceHash &&
          typeof subject === 'string' && subject.length > 0 && subject.length <= 255) {
        return subject
      }
    } catch {
      // Verification details and raw tokens stay out of responses and logs.
    }
    return undefined
  }

  router.use((_req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
    next()
  })

  router.post('/login', loginRateLimit(10), async (req, res) => {
    const parsed = loginRequestSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, 400, 'INVALID_REQUEST')
    const { platform } = parsed.data
    if (!allowsPlatform(req, platform)) return sendError(res, 403, 'FORBIDDEN')

    const user = await authenticatePassword(parsed.data)
    if (!user) return sendError(res, 401, 'INVALID_CREDENTIALS')

    const previousToken = platform === 'web' ? readCookie(req, sessionCookie) : undefined
    const { token, session } = await createSession(db, user, previousToken)
    if (platform === 'web') {
      setWebSession(res, token, session)
      res.clearCookie(googleCookie, googleCookieOptions).json(session)
    } else {
      res.json({ ...session, token })
    }
  })

  router.post('/google/attempts', loginRateLimit(15), async (req, res) => {
    const parsed = googleAttemptRequestSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, 400, 'INVALID_REQUEST')
    const { platform } = parsed.data
    if (!allowsPlatform(req, platform)) return sendError(res, 403, 'FORBIDDEN')
    if (!config.googleClientId || (platform === 'web' && !config.googleRedirectUri)) {
      return sendError(res, 503, 'GOOGLE_UNAVAILABLE')
    }

    const { attempt, nonce, browserProof, verifier } = await createGoogleAttempt(db, platform)
    if (browserProof && verifier) {
      res.cookie(googleCookie, browserProof, { ...googleCookieOptions, maxAge: GOOGLE_ATTEMPT_TTL_MS })
      res.json({ platform, authorizationUrl: google.authorizationUrl(attempt, nonce, verifier) })
    } else {
      res.json({ platform, attempt, nonce, clientId: config.googleClientId })
    }
  })

  router.get('/google/callback', async (req, res) => {
    const state = authTokenSchema.safeParse(req.query.state).data
    const proof = readCookie(req, googleCookie)
    if (!config.googleRedirectUri || !state || !proof) return redirectGoogle(res, 'GOOGLE_FAILED')

    const attempt = await consumeGoogleAttempt(db, state, 'web', proof)
    if (!attempt?.verifier) return redirectGoogle(res, 'GOOGLE_FAILED')
    res.clearCookie(googleCookie, googleCookieOptions)
    if (req.query.error === 'access_denied') return redirectGoogle(res, 'GOOGLE_CANCELLED')

    const { code } = req.query
    if (req.query.error || typeof code !== 'string' || !code || code.length > 2048) {
      return redirectGoogle(res, 'GOOGLE_FAILED')
    }
    const idToken = await google.exchangeCode(code, attempt.verifier).catch(() => undefined)
    const subject = idToken && await verifyGoogleSubject(idToken, attempt.nonceHash)
    if (!subject) return redirectGoogle(res, 'GOOGLE_FAILED')

    const user = await findGoogleUser(db, subject)
    if (!user) return redirectGoogle(res, 'GOOGLE_NOT_LINKED')

    const { token, session } = await createSession(db, user, readCookie(req, sessionCookie))
    setWebSession(res, token, session)
    redirectGoogle(res)
  })

  router.post('/google/login', loginRateLimit(10), async (req, res) => {
    const parsed = googleLoginRequestSchema.safeParse(req.body)
    if (!parsed.success) return sendError(res, 400, 'INVALID_REQUEST')
    if (!allowsPlatform(req, 'android')) return sendError(res, 403, 'FORBIDDEN')
    if (!config.googleClientId) return sendError(res, 503, 'GOOGLE_UNAVAILABLE')

    const { idToken, attempt: attemptToken } = parsed.data
    const attempt = await consumeGoogleAttempt(db, attemptToken, 'android')
    const subject = attempt && await verifyGoogleSubject(idToken, attempt.nonceHash)
    if (!subject) return sendError(res, 401, 'GOOGLE_FAILED')

    const user = await findGoogleUser(db, subject)
    if (!user) return sendError(res, 403, 'GOOGLE_NOT_LINKED')
    const { token, session } = await createSession(db, user)
    res.json({ ...session, token })
  })

  router.get('/session', async (req, res, next) => {
    const token = readSessionToken(req, sessionCookie)
    const session = token && await findSession(db, token)
    if (!session) return sendError(res, 401, 'UNAUTHENTICATED')
    res.locals.session = session
    next()
  }, (_req, res) => {
    res.json(res.locals.session)
  })

  router.post('/logout', async (req, res) => {
    const isWeb = req.headers.origin !== undefined || req.headers.cookie !== undefined
    if (isWeb && (!allowsPlatform(req, 'web') || req.headers.authorization !== undefined)) {
      return sendError(res, 403, 'FORBIDDEN')
    }
    const token = readSessionToken(req, sessionCookie)
    if (token) await revokeSession(db, token)
    if (isWeb) {
      res.clearCookie(sessionCookie, sessionCookieOptions).clearCookie(googleCookie, googleCookieOptions)
    }
    res.status(204).end()
  })

  return router
}
