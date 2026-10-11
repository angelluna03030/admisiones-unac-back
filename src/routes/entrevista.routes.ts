import { Router } from 'express';
import { entrevistaController } from '../controllers/entrevista.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const entrevistaRoutes = Router();

entrevistaRoutes.get('/', entrevistaController.getAll);
entrevistaRoutes.get('/:id', entrevistaController.getById);
const agendar = requireRole(['ADMISIONES', 'CAPELLAN', 'COORDINADOR_PROGRAMA']);
const evaluar = requireRole(['CAPELLAN', 'COORDINADOR_PROGRAMA']);
entrevistaRoutes.post('/', agendar, entrevistaController.create);
entrevistaRoutes.put('/:id', agendar, entrevistaController.update);
entrevistaRoutes.post('/:id/evaluacion', evaluar, entrevistaController.evaluar);
entrevistaRoutes.delete('/:id', agendar, entrevistaController.delete);
