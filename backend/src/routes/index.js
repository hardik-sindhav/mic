import { Router } from 'express'
import { adsRoutes } from './ads.routes.js'
import { appSettingsRoutes } from './appSettings.routes.js'
import { authRoutes } from './auth.routes.js'
import { cardsRoutes } from './cards.routes.js'
import { shopRoutes } from './shop.routes.js'
import { statsRoutes } from './stats.routes.js'
import { userRoutes } from './user.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRoutes) // Admin login
apiRouter.use('/users', userRoutes) // Mobile app user auth
apiRouter.use('/stats', statsRoutes)
apiRouter.use('/cards', cardsRoutes)
apiRouter.use('/shop', shopRoutes)
apiRouter.use('/ads', adsRoutes)
apiRouter.use('/app-settings', appSettingsRoutes)
