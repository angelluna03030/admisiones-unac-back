import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';

// Ya no importamos requireRole por ahora

export const usuarioRoutes = Router();

// Rutas abiertas temporalmente para poder probar desde el Frontend
// (Más adelante, cuando hagamos el Login, volveremos a protegerlas)
usuarioRoutes.get('/', usuarioController.getAll);
usuarioRoutes.get('/:id', usuarioController.getById);
usuarioRoutes.post('/', usuarioController.create);
usuarioRoutes.put('/:id', usuarioController.update);
usuarioRoutes.delete('/:id', usuarioController.delete);
