import cors from 'cors'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import hpp from 'hpp'
import pinoHttp from 'pino-http'
import { env, getCorsOrigins } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiters.js'
import { apiRouter } from './routes/index.js'

export function createApp(logger) {
  const app = express()
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  )

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  const allowedOrigins = getCorsOrigins()
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true)
        }
        if (allowedOrigins.length === 0) {
          if (env.NODE_ENV === 'production') {
            return callback(new Error('CORS: set CORS_ORIGINS in production'))
          }
          return callback(null, true)
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
      },
      credentials: true,
      maxAge: 86_400,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  /* Card images are sent as base64 JSON — 5MB file ≈ 6.7MB string; allow headroom */
  app.use(express.json({ limit: '12mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(hpp())
  app.use(mongoSanitize({ replaceWith: '_' }))

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() })
  })

  // Handle preflight OPTIONS requests for all route
  app.options('*', cors())

  app.use('/api', apiLimiter, apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
