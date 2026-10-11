import { Router } from 'express';
import { aspiranteController } from '../controllers/aspirante.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const aspiranteRoutes = Router();

aspiranteRoutes.get('/', aspiranteController.getAll);
aspiranteRoutes.get('/:id', aspiranteController.getById);
const escribir = requireRole(['ADMISIONES']);
aspiranteRoutes.post('/', escribir, aspiranteController.create);
aspiranteRoutes.put('/:id', escribir, aspiranteController.update);
