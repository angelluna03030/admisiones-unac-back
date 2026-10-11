import { Router } from 'express';
import { documentoController } from '../controllers/documento.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const documentoRoutes = Router();

documentoRoutes.get('/', documentoController.getAll);
const escribir = requireRole(['ADMISIONES']);
documentoRoutes.post('/', escribir, documentoController.create);
documentoRoutes.put('/:id', escribir, documentoController.update);
documentoRoutes.patch(
  '/:id/estado',
  escribir,
  documentoController.cambiarEstado,
);
documentoRoutes.delete('/:id', escribir, documentoController.delete);
