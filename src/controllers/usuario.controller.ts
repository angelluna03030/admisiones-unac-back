import type { Request, Response } from 'express';
import { usuarioService } from '../models/usuario.service';
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from '../domain/usuario/usuario.schema';

export const usuarioController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const data = await usuarioService.getAll();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await usuarioService.getById(id as string);

      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      // 1. Validar con Zod
      const validationResult = createUsuarioSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      // 2. Ejecutar lógica
      const data = await usuarioService.create(validationResult.data);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res
          .status(409)
          .json({
            success: false,
            message: 'El correo electrónico ya está registrado',
          });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const validationResult = updateUsuarioSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const data = await usuarioService.update(
        id as string,
        validationResult.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });
      }
      if (error.code === 'P2002') {
        return res
          .status(409)
          .json({
            success: false,
            message: 'El correo electrónico ya está en uso',
          });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await usuarioService.delete(id as string);
      res
        .status(200)
        .json({ success: true, message: 'Usuario desactivado correctamente' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });
      }
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  },
};
