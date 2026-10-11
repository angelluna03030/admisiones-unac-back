import { Router } from 'express';
import { observacionController } from '../controllers/observacion.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const observacionRoutes = Router();

const escribir = requireRole(['ADMISIONES']);

observacionRoutes.get('/', observacionController.getAll);
observacionRoutes.post('/', escribir, observacionController.create);
observacionRoutes.put('/:id', escribir, observacionController.update);
observacionRoutes.patch(
  '/:id/resolver',
  escribir,
  observacionController.resolver,
);
observacionRoutes.delete('/:id', escribir, observacionController.delete);
