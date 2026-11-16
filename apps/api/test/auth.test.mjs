import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, randomUUID, sign } from 'node:crypto'
import { after, before, test } from 'node:test'
import { OAuth2Client } from 'google-auth-library'
import { createApp } from '../dist/app.js'
import { createGoogleProvider } from '../dist/auth/google.js'
import { hashPassword } from '../dist/auth/password.js'
import { hashToken } from '../dist/auth/tokens.js'
import { readConfig } from '../dist/config.js'
import { createDatabase } from '../dist/db.js'

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL
if (!databaseUrl) throw new Error('Set AUTH_TEST_DATABASE_URL to a migrated PostgreSQL test database')

const webOrigin = 'https://sotien.example'
const redirectUri = `${webOrigin}/api/auth/google/callback`
const config = readConfig({
  NODE_ENV: 'production',
  DATABASE_URL: databaseUrl,
  WEB_ORIGIN: webOrigin,
  GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'test-only',
  GOOGLE_REDIRECT_URI: redirectUri,
})
const password = 'Temporary test credential'
const email = `auth-test-${randomUUID()}@example.test`
const subject = randomUUID()
const attemptHashes = []
const db = createDatabase(databaseUrl)
const google = createGoogleProvider(config)
let listener
let url
let user

before(async () => {
  user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      identities: { create: { provider: 'google', providerSubject: subject } },
    },
    select: { id: true, email: true },
  })
  // Use the real Google URL builder, and stand in for Google's token endpoint and token verifier.
  const app = createApp(config, db, {
    ...google,
    async exchangeCode(code, verifier) {
      const { challenge, token } = JSON.parse(code)
      assert.equal(createHash('sha256').update(verifier).digest('base64url'), challenge)
      return token
    },
    async verifyIdToken(token) {
      return JSON.parse(token)
    },
  })
  await new Promise((resolve) => { listener = app.listen(0, '127.0.0.1', resolve) })
  url = `http://127.0.0.1:${listener.address().port}/api/auth`
})

after(async () => {
  try {
    if (listener) await new Promise((resolve) => listener.close(resolve))
    if (user) await db.user.delete({ where: { id: user.id } })
    await db.oAuthAttempt.deleteMany({ where: { tokenHash: { in: attemptHashes } } })
  } finally {
    await db.$disconnect()
  }
})

function call(path, { method = 'GET', body, origin, cookie, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (origin) headers.Origin = origin
  if (cookie) headers.Cookie = cookie
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${url}${path}`, {
    method, headers, body: body && JSON.stringify(body), redirect: 'manual',
  })
}

function post(path, options) {
  return call(path, { ...options, method: 'POST' })
}

function cookieHeader(response, name) {
  const cookie = response.headers.getSetCookie().find((part) => part.startsWith(`${name}=`))
  assert.ok(cookie)
  return cookie
}

async function assertError(response, status, error) {
  assert.equal(response.status, status)
  assert.deepEqual(await response.json(), { error })
}

async function startGoogle(platform) {
  const response = await post('/google/attempts', {
    body: { platform },
    origin: platform === 'web' ? webOrigin : undefined,
  })
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.platform, platform)
  if (platform === 'android') {
    attemptHashes.push(hashToken(data.attempt))
    return data
  }

  const authorization = new URL(data.authorizationUrl)
  assert.equal(authorization.origin, 'https://accounts.google.com')
  assert.equal(authorization.searchParams.get('redirect_uri'), redirectUri)
  assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256')
  const state = authorization.searchParams.get('state')
  const nonce = authorization.searchParams.get('nonce')
  const challenge = authorization.searchParams.get('code_challenge')
  assert.ok(state && nonce && challenge)
  attemptHashes.push(hashToken(state))
  const cookie = cookieHeader(response, '__Host-sotien_google')
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/)
  return { state, nonce, challenge, cookie: cookie.split(';')[0] }
}

test('Web password login binds an HttpOnly cookie and rejects cross-origin mutations', async () => {
  const body = { email: ` ${email.toUpperCase()} `, password, platform: 'web' }
  await assertError(await post('/login', { body, origin: 'https://other.example' }), 403, 'FORBIDDEN')
  const response = await post('/login', { body, origin: webOrigin })
  assert.equal(response.status, 200)
  const cookie = cookieHeader(response, '__Host-sotien_session')
  assert.match(cookie, /Path=\/; Expires=.*; HttpOnly; Secure; SameSite=Strict/)
  const session = await response.json()
  assert.deepEqual(session.user, user)
  assert.equal(session.token, undefined)
  const cookiePair = cookie.split(';')[0]
  const token = cookiePair.split('=')[1]
  const record = await db.authSession.findUnique({ where: { tokenHash: hashToken(token) } })
  assert.equal(record.userId, user.id)
  assert.deepEqual(await (await call('/session', { cookie: cookiePair })).json(), session)
  await assertError(await post('/logout', { cookie: cookiePair, origin: 'https://other.example' }), 403, 'FORBIDDEN')
  const logout = await post('/logout', { cookie: cookiePair, origin: webOrigin })
  assert.equal(logout.status, 204)
  assert.match(cookieHeader(logout, '__Host-sotien_session'), /^__Host-sotien_session=;/)
  await assertError(await call('/session', { cookie: cookiePair }), 401, 'UNAUTHENTICATED')
})

test('Android login returns a bearer token and protects revoked and expired sessions', async () => {
  for (const [submittedEmail, submittedPassword] of [[email, 'wrong'], ['unknown@example.test', password]]) {
    await assertError(await post('/login', {
      body: { email: submittedEmail, password: submittedPassword, platform: 'android' },
    }), 401, 'INVALID_CREDENTIALS')
  }
  await assertError(await post('/login', {
    body: { email, password, platform: 'android' }, origin: webOrigin,
  }), 403, 'FORBIDDEN')

  const login = async () => {
    const response = await post('/login', { body: { email, password, platform: 'android' } })
    assert.equal(response.status, 200)
    assert.deepEqual(response.headers.getSetCookie(), [])
    return response.json()
  }
  const { token, ...session } = await login()
  assert.deepEqual(session.user, user)
  assert.equal(typeof token, 'string')
  assert.deepEqual(await (await call('/session', { token })).json(), session)
  assert.equal((await post('/logout', { token })).status, 204)
  assert.equal((await post('/logout', { token })).status, 204)
  await assertError(await call('/session', { token }), 401, 'UNAUTHENTICATED')

  const expiring = await login()
  await db.authSession.update({
    where: { tokenHash: hashToken(expiring.token) }, data: { expiresAt: new Date(0) },
  })
  await assertError(await call('/session', { token: expiring.token }), 401, 'UNAUTHENTICATED')
})

test('Android Google login verifies the nonce and consumes attempts atomically', async () => {
  const authenticate = (attempt, claims) => post('/google/login', {
    body: { attempt, idToken: JSON.stringify(claims) },
  })
  const { attempt, nonce } = await startGoogle('android')
  const results = await Promise.all([
    authenticate(attempt, { subject, nonce }), authenticate(attempt, { subject, nonce }),
  ])
  const accepted = results.find((response) => response.status === 200)
  const rejected = results.find((response) => response.status === 401)
  assert.ok(accepted && rejected)
  const { token } = await accepted.json()
  assert.deepEqual((await (await call('/session', { token })).json()).user, user)
  await assertError(rejected, 401, 'GOOGLE_FAILED')

  const wrong = await startGoogle('android')
  await assertError(await authenticate(wrong.attempt, { subject, nonce: 'incorrect' }), 401, 'GOOGLE_FAILED')
  const unlinked = await startGoogle('android')
  await assertError(await authenticate(unlinked.attempt, {
    subject: randomUUID(), nonce: unlinked.nonce, email,
  }), 403, 'GOOGLE_NOT_LINKED')
  const expired = await startGoogle('android')
  await db.oAuthAttempt.update({
    where: { tokenHash: hashToken(expired.attempt) }, data: { expiresAt: new Date(0) },
  })
  await assertError(await authenticate(expired.attempt, {
    subject, nonce: expired.nonce,
  }), 401, 'GOOGLE_FAILED')
})

test('Web Google login binds state to the browser, validates PKCE, and handles cancellation', async () => {
  const { state, nonce, challenge, cookie } = await startGoogle('web')
  const code = JSON.stringify({ challenge, token: JSON.stringify({ subject, nonce }) })
  const callback = `/google/callback?${new URLSearchParams({ state, code })}`
  const unbound = await call(callback)
  assert.equal(unbound.headers.get('location'), `${webOrigin}/dang-nhap?google=GOOGLE_FAILED`)

  const response = await call(callback, { cookie })
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), `${webOrigin}/`)
  const sessionCookie = cookieHeader(response, '__Host-sotien_session')
  assert.deepEqual((await (await call('/session', { cookie: sessionCookie.split(';')[0] })).json()).user, user)
  assert.equal((await call(callback, { cookie })).headers.get('location'),
    `${webOrigin}/dang-nhap?google=GOOGLE_FAILED`)

  const canceled = await startGoogle('web')
  const cancellation = await call(`/google/callback?error=access_denied&state=${canceled.state}`, {
    cookie: canceled.cookie,
  })
  assert.equal(cancellation.headers.get('location'), `${webOrigin}/dang-nhap?google=GOOGLE_CANCELLED`)
  assert.equal(cancellation.headers.getSetCookie().some((value) => value.startsWith('__Host-sotien_session=')), false)
})

test('Google verifier rejects bad signatures, audience, issuers and expired claims', async (context) => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  context.mock.method(OAuth2Client.prototype, 'getFederatedSignonCertsAsync', async () => ({
    format: 'PEM',
    certs: { localKey: publicKey.export({ type: 'spki', format: 'pem' }) },
  }))
  const timestamp = Math.floor(Date.now() / 1000)
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'RS256', kid: 'localKey' })
  const claims = {
    iss: 'https://accounts.google.com',
    aud: config.googleClientId,
    sub: subject,
    iat: timestamp - 1000,
    exp: timestamp + 1800,
    nonce: 'test-nonce',
  }
  function token(overrides, hasValidSignature = true) {
    const input = `${header}.${encode({ ...claims, ...overrides })}`
    const signature = sign('RSA-SHA256', Buffer.from(input), privateKey)
    if (!hasValidSignature) signature[0] ^= 1
    return `${input}.${signature.toString('base64url')}`
  }

  assert.deepEqual(await google.verifyIdToken(token()), { subject, nonce: claims.nonce })
  await assert.rejects(google.verifyIdToken(token({}, false)))
  await assert.rejects(google.verifyIdToken(token({ aud: 'untrusted-client' })))
  await assert.rejects(google.verifyIdToken(token({ iss: 'https://other.example' })))
  await assert.rejects(google.verifyIdToken(token({ exp: timestamp - 600 })))
})

test('password login throttles repeated attempts', async () => {
  const body = { email, password: 'wrong', platform: 'android' }
  for (let attempt = 0; attempt <= 10; attempt += 1) {
    const response = await post('/login', { body })
    if (response.status === 429) {
      await assertError(response, 429, 'RATE_LIMITED')
      return
    }
    await assertError(response, 401, 'INVALID_CREDENTIALS')
  }
  assert.fail('Expected password login to be rate-limited')
})
