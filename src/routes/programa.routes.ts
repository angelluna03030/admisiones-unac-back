import { Router } from 'express';
import { programaController } from '../controllers/programa.controller';

export const programaRoutes = Router();

// ============================================================================
// RUTAS DE PROGRAMAS ACADÉMICOS
// ============================================================================

// 1. Obtener todos los programas (con paginación y búsqueda opcional)
programaRoutes.get('/', programaController.getAll);

// 2. Obtener un programa específico por su ID

// 3. Crear un nuevo programa académico
programaRoutes.post('/', programaController.create);

// 4. Actualizar un programa existente (PUT para reemplazo/actualización completa de campos permitidos)
programaRoutes.put('/:id', programaController.update);

// 5. Activar o desactivar un programa (Cambio de estado lógico)
programaRoutes.patch('/:id/estado', programaController.toggleStatus);

// Nota: No usamos DELETE para no romper la integridad referencial con las Solicitudes.
// El campo 'activo: false' cumple la función de "eliminación lógica".
