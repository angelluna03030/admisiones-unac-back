import { Router } from 'express';
import { solicitudController } from '../controllers/solicitud.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const solicitudRoutes = Router();

solicitudRoutes.get('/', solicitudController.getAll);
solicitudRoutes.get('/:id', solicitudController.getById);
// Admisiones gestiona la solicitud; Financiera registra pagos y Registro Académico la matrícula
const escribir = requireRole([
  'ADMISIONES',
  'OFICINA_FINANCIERA',
  'REGISTRO_ACADEMICO',
]);
solicitudRoutes.post('/', escribir, solicitudController.create);
solicitudRoutes.put('/:id', escribir, solicitudController.update);
solicitudRoutes.patch(
  '/:id/estado',
  escribir,
  solicitudController.cambiarEstado,
);

// Nota: no hay DELETE. Una solicitud se cierra pasándola a estado ARCHIVADO
// para conservar el historial de entrevistas, documentos y decisiones.
