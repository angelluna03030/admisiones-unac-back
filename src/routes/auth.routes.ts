import { Router } from 'express';
import { authController, limitarLogin } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/login', limitarLogin, authController.login);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', requireAuth, authController.me);
authRoutes.put('/password', requireAuth, authController.cambiarPassword);
