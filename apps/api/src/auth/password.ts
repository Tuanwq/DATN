import { Algorithm, hash, verify } from '@node-rs/argon2'
import { randomBytes } from 'node:crypto'
import type { PasswordLogin } from '@so-tien/shared/auth'
import type { Database } from '../db.js'

export function hashPassword(password: string) {
  return hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  })
}

export function createPasswordAuthenticator(db: Database) {
  // Run the same verification work when an email has no password credential.
  const dummyHash = hashPassword(randomBytes(32).toString('base64url'))
  return async ({ email, password }: PasswordLogin) => {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    })
    const matches = await verify(user?.passwordHash ?? await dummyHash, password)
    if (!user?.passwordHash || !matches) return null
    return { id: user.id, email: user.email }
  }
}
