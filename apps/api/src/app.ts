import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { createGoogleProvider } from './auth/google.js'
import { createAuthRouter } from './auth/routes.js'
import type { ApiConfig } from './config.js'
import type { Database } from './db.js'

export function createApp(config: ApiConfig, db: Database, google = createGoogleProvider(config)) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxyHops || false)
  app.use('/api/auth',
    cors({ origin: config.webOrigin, credentials: true, methods: ['GET', 'POST'] }),
    express.json({ limit: '16kb' }),
    createAuthRouter(config, db, google),
  )

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error)
    res.set('Cache-Control', 'no-store')
    if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'INVALID_REQUEST' })
    } else if (error?.type === 'entity.too.large') {
      res.status(413).json({ error: 'INVALID_REQUEST' })
    } else {
      console.error('Authentication request failed', error?.constructor?.name ?? 'Error')
      res.status(500).json({ error: 'SERVER_ERROR' })
    }
  }
  app.use(handleError)
  return app
}
