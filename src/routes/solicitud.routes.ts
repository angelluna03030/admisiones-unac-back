import { Router } from 'express';
import { solicitudController } from '../controllers/solicitud.controller';

export const solicitudRoutes = Router();

solicitudRoutes.get('/', solicitudController.getAll);
solicitudRoutes.get('/:id', solicitudController.getById);
solicitudRoutes.post('/', solicitudController.create);
solicitudRoutes.put('/:id', solicitudController.update);
solicitudRoutes.patch('/:id/estado', solicitudController.cambiarEstado);

// Nota: no hay DELETE. Una solicitud se cierra pasándola a estado ARCHIVADO
// para conservar el historial de entrevistas, documentos y decisiones.
