import { Router } from 'express';
import { programaController } from '../controllers/programa.controller';

export const programaRoutes = Router();

// Rutas para Programas Académicos
programaRoutes.get('/', programaController.getAll);
programaRoutes.get('/:id', programaController.getById);
programaRoutes.post('/', programaController.create);

// Puedes agregar PUT y DELETE aquí más adelante
