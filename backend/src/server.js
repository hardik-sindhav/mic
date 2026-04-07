import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import pino from 'pino'

/* Import your routes here */
import { authRoutes } from './routes/auth.routes.js'
// import other routes if needed

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
})

export function createApp(logger) {
  const app = express()

  /*
   SECURITY MIDDLEWARE
  */
  app.use(helmet())

  /*
   CORS CONFIG (IMPORTANT FIX)
  */
  const allowedOrigins = [
    'https://admin.mic.xfinai.cloud',
    'https://mic.xfinai.cloud',
    'http://localhost:5173', // local dev
    'http://localhost:3000'  // optional
  ]

  app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin 
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  /*
   HANDLE PREFLIGHT (VERY IMPORTANT)
  */
  app.options('*', cors())

  /*
   BODY PARSER
  */
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  /*
   LOGGING
  */
  app.use(morgan('dev'))

  /*
   HEALTH CHECK ROUTE
  */
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'MIC API running'
    })
  })

  /*
   ROUTES
  */
  app.use('/api/auth', authRoutes)

  // add more routes like:
  // app.use('/api/admin', adminRoutes)

  /*
   404 HANDLER
  */
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    })
  })

  /*
   ERROR HANDLER
  */
  app.use((err, req, res, next) => {
    logger.error(err)

    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    })
  })

  return app
}

/*
 START SERVER
*/
const PORT = process.env.PORT || 3000
const app = createApp(logger)

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/api/health`)
})
