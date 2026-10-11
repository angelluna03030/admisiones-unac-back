import { Router } from 'express';
import { programaController } from '../controllers/programa.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

export const programaRoutes = Router();

// ============================================================================
// RUTAS DE PROGRAMAS ACADÉMICOS
// ============================================================================

// 1. Obtener todos los programas (público: lo usa el formulario de la landing)
programaRoutes.get('/', programaController.getAll);

// 2. Obtener un programa específico por su ID

// 3. Crear un nuevo programa académico
const escribir = [requireAuth, requireRole(['ADMISIONES'])];
programaRoutes.post('/', escribir, programaController.create);

// 4. Actualizar un programa existente (PUT para reemplazo/actualización completa de campos permitidos)
programaRoutes.put('/:id', escribir, programaController.update);

// 5. Activar o desactivar un programa (Cambio de estado lógico)
programaRoutes.patch('/:id/estado', escribir, programaController.toggleStatus);

// Nota: No usamos DELETE para no romper la integridad referencial con las Solicitudes.
// El campo 'activo: false' cumple la función de "eliminación lógica".
