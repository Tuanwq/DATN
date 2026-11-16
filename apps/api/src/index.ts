import 'dotenv/config'
import { createApp } from './app.js'
import { readConfig } from './config.js'
import { createDatabase } from './db.js'

const config = readConfig()
const db = createDatabase(config.databaseUrl)
await db.$connect()

const server = createApp(config, db).listen(config.port, config.host, () => {
  console.log(`Sổ Tiền API is listening on ${config.host}:${config.port}`)
})

async function clearExpiredAuthRecords() {
  const expiresAt = { lte: new Date() }
  try {
    await db.$transaction([
      db.oAuthAttempt.deleteMany({ where: { expiresAt } }),
      db.authSession.deleteMany({ where: { expiresAt } }),
    ])
  } catch {
    console.error('Authentication cleanup failed')
  }
}

void clearExpiredAuthRecords()
const cleanup = setInterval(clearExpiredAuthRecords, 60 * 60 * 1000)

function stop() {
  clearInterval(cleanup)
  server.close(() => { void db.$disconnect() })
}

process.once('SIGINT', stop)
process.once('SIGTERM', stop)
