import { Router } from 'express';
import { decisionController } from '../controllers/decision.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const decisionRoutes = Router();

decisionRoutes.get('/', decisionController.getAll);
// Coordinación decide; Vicerrectoría ratifica
const decidir = requireRole(['COORDINADOR_PROGRAMA']);
const ratificar = requireRole(['VICERRECTORIA']);
decisionRoutes.post('/', decidir, decisionController.create);
decisionRoutes.put('/:id', decidir, decisionController.update);
decisionRoutes.patch(
  '/:id/ratificacion',
  ratificar,
  decisionController.ratificar,
);

// Solo se pueden eliminar decisiones que aún no revisó Vicerrectoría
decisionRoutes.delete('/:id', decidir, decisionController.delete);
