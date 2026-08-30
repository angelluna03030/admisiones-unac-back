import { Router } from 'express';
import { entrevistaController } from '../controllers/entrevista.controller';

export const entrevistaRoutes = Router();

entrevistaRoutes.get('/', entrevistaController.getAll);
entrevistaRoutes.get('/:id', entrevistaController.getById);
entrevistaRoutes.post('/', entrevistaController.create);
entrevistaRoutes.put('/:id', entrevistaController.update);
entrevistaRoutes.delete('/:id', entrevistaController.delete);
