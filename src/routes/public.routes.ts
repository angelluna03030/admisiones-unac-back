import { Router } from 'express';
import { publicController } from '../controllers/public.controller';
import { limitarChat } from '../controllers/chat.controller';

export const publicRoutes = Router();

// Pre-inscripción del formulario de la landing (sin sesión)
publicRoutes.post(
  '/preinscripcion',
  limitarChat,
  publicController.preinscribir,
);
