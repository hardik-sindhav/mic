import { Router } from 'express'
import { 
  postSignIn, 
  postSignUp, 
  patchUserProfile, 
  patchUserFcmToken,
  getUsersAdmin,
  deleteUserAdmin,
  toggleBlockUserAdmin
} from '../controllers/user.controller.js'
import { upload } from '../middleware/upload.js'
import { requireAuth } from '../middleware/authenticate.js'

const r = Router()

/** Public routes for app authentication */
r.post('/sign-in', postSignIn)
r.post('/sign-up', upload.single('image'), postSignUp)

/** Admin routes */
r.get('/', requireAuth, getUsersAdmin)
r.delete('/:id', requireAuth, deleteUserAdmin)
r.post('/:id/toggle-block', requireAuth, toggleBlockUserAdmin)

/** Authenticated routes for app users */
r.patch('/:id', upload.single('image'), patchUserProfile)
r.patch('/:id/fcm', patchUserFcmToken)

export const userRoutes = r
