import { Router } from 'express'
import {
  getCustomAdsPublic,
  getCustomAdsAdmin,
  postCustomAd,
  patchCustomAd,
  deleteCustomAd,
  putCustomAdsOrder,
} from '../controllers/customAd.controller.js'
import { requireAuth } from '../middleware/authenticate.js'

const r = Router()

/** Public: Fetch only active ads */
r.get('/', getCustomAdsPublic)

/** Admin: Management */
r.get('/admin', requireAuth, getCustomAdsAdmin)
r.post('/', requireAuth, postCustomAd)
r.put('/order', requireAuth, putCustomAdsOrder)
r.patch('/:id', requireAuth, patchCustomAd)
r.delete('/:id', requireAuth, deleteCustomAd)

export const customAdsRoutes = r
