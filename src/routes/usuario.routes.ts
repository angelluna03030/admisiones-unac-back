import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';
import { requireRole } from '../middlewares/auth.middleware';

export const usuarioRoutes = Router();

// La lista es visible para cualquier usuario con sesión (se usa para elegir evaluadores);
// solo el administrador crea, edita o desactiva usuarios
const soloAdmin = requireRole(['ADMIN']);
usuarioRoutes.get('/', usuarioController.getAll);
usuarioRoutes.get('/:id', usuarioController.getById);
usuarioRoutes.post('/', soloAdmin, usuarioController.create);
usuarioRoutes.put('/:id', soloAdmin, usuarioController.update);
usuarioRoutes.delete('/:id', soloAdmin, usuarioController.delete);
