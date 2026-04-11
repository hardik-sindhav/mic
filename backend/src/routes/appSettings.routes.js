import { Router } from 'express'
import { getAppSettingsPublic, putAppSettings } from '../controllers/appSettings.controller.js'
import { requireAuth } from '../middleware/authenticate.js'

const r = Router()

r.get('/', getAppSettingsPublic)
r.put('/', requireAuth, putAppSettings)

export const appSettingsRoutes = r
