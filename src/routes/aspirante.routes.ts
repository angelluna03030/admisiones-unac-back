import { Router } from 'express';
import { aspiranteController } from '../controllers/aspirante.controller';

export const aspiranteRoutes = Router();

aspiranteRoutes.get('/', aspiranteController.getAll);
aspiranteRoutes.get('/:id', aspiranteController.getById);
aspiranteRoutes.post('/', aspiranteController.create);
aspiranteRoutes.put('/:id', aspiranteController.update);
