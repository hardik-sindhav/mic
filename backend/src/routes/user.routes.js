import { Router } from 'express'
import { postSignIn, postSignUp } from '../controllers/user.controller.js'

const r = Router()

/** Public routes for app authentication */
r.post('/sign-in', postSignIn)
r.post('/sign-up', postSignUp)

export const userRoutes = r
