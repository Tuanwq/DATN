import type { AuthSession } from '@so-tien/shared/auth'
import type { Database } from '../db.js'
import { createToken, hashToken } from './tokens.js'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function createSession(db: Database, user: AuthSession['user'], previousToken?: string) {
  const token = createToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.$transaction(async (transaction) => {
    if (previousToken) {
      await transaction.authSession.updateMany({
        where: { tokenHash: hashToken(previousToken), revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    await transaction.authSession.create({
      data: { tokenHash: hashToken(token), userId: user.id, expiresAt },
    })
  })
  return { token, session: { user, expiresAt: expiresAt.toISOString() } }
}

export async function findSession(db: Database, token: string): Promise<AuthSession | null> {
  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
    select: { expiresAt: true, user: { select: { id: true, email: true } } },
  })
  return session && { ...session, expiresAt: session.expiresAt.toISOString() }
}

export async function revokeSession(db: Database, token: string) {
  await db.authSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
