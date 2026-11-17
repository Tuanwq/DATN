import 'dotenv/config'
import { emailSchema } from '@so-tien/shared/auth'
import { hashPassword } from '../auth/password.js'
import { createDatabase } from '../db.js'

const email = emailSchema.safeParse(process.env.AUTH_FIXTURE_EMAIL).data
const password = process.env.AUTH_FIXTURE_PASSWORD
const subject = process.env.AUTH_FIXTURE_GOOGLE_SUB
const databaseUrl = process.env.DATABASE_URL
if (process.env.NODE_ENV === 'production' || !databaseUrl || !email ||
    (!password && !subject) || (password && password.length > 1024) || (subject && subject.length > 255)) {
  throw new Error('Use a development database and set AUTH_FIXTURE_EMAIL with a password and/or Google subject')
}

const db = createDatabase(databaseUrl)
try {
  const passwordHash = password ? await hashPassword(password) : null
  await db.user.create({
    data: {
      email,
      passwordHash,
      identities: subject ? { create: { provider: 'google', providerSubject: subject } } : undefined,
    },
  })
  console.log('Development account created')
} finally {
  await db.$disconnect()
}
